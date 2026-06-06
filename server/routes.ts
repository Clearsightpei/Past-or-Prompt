import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  insertFolderSchema,
  createFolderSchema,
  unlockFolderSchema,
  updateFolderSchema,
  insertStorySchema,
  insertSubmissionSchema,
  insertUserAttemptSchema,
  insertReportSchema,
  signupSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} from "@shared/schema";
import type { Request } from "express";
import { z } from "zod";
import crypto from "crypto";
import { stripHtml, stripHtmlNullable } from "./middleware/sanitize";
import { submitLimiter, attemptLimiter, sensitiveLimiter } from "./middleware/rateLimit";
import { requireAdmin, requireUser, adminLogin, adminLogout } from "./middleware/adminAuth";
import { moderateText, enqueueFakeGeneration, generateFake } from "./ollama";
import { sendPasswordResetEmail } from "./mailer";

// Run AI moderation over submitted text → a story status. Fails CLOSED to
// "pending" (human review) if the model is unavailable. Shared by submit/publish.
async function moderateContent(text: string): Promise<{ status: string; reason: string }> {
  let verdict: "approve" | "review" | "reject" = "review";
  let reason = "";
  try {
    const result = await moderateText(text);
    verdict = result.verdict;
    reason = result.reasons;
  } catch {
    verdict = "review";
    reason = "Moderation model unavailable; queued for human review.";
  }
  const status = verdict === "approve" ? "approved" : verdict === "reject" ? "rejected" : "pending";
  return { status, reason };
}

// Re-run AI moderation on a story (e.g. after it's reported, since it may have
// been edited since first approval). AI confident → auto-handle; only "review"
// (AI unsure) escalates to a human in the flagged queue. Fire-and-forget.
async function remoderateStory(storyId: number): Promise<void> {
  const story = await storage.getStoryById(storyId);
  if (!story) return;

  let verdict: "approve" | "review" | "reject" = "review";
  let reasons = "";
  try {
    const result = await moderateText([story.event, story.true_version].filter(Boolean).join("\n\n"));
    verdict = result.verdict;
    reasons = result.reasons;
  } catch {
    verdict = "review";
    reasons = "Moderation unavailable on re-check.";
  }

  if (verdict === "reject") {
    await storage.setStoryStatus(storyId, "rejected", reasons);
    await storage.resolveReportsForStory(storyId, "reviewed");
  } else if (verdict === "review") {
    await storage.setStoryStatus(storyId, "flagged", reasons); // human takes a look
  } else {
    // AI is confident it's fine — keep it live and clear the reports.
    await storage.resolveReportsForStory(storyId, "reviewed");
  }
}

// Editing (stories + the collection itself) requires: admin, OR the account
// that owns the collection, OR a session that unlocked it (created it this
// session, or entered its password). General (id 1) stays admin-only.
function canEditCollection(
  req: Request,
  folder: { id: number; password_hash: string | null; owner_user_id?: number | null },
): boolean {
  if (req.session?.isAdmin) return true;
  if (folder.id === 1) return false; // General is admin-only
  if (folder.owner_user_id && req.session?.userId === folder.owner_user_id) return true;
  return (req.session?.unlockedCollections || []).includes(folder.id);
}

// A story can be edited/deleted by: its author (logged-in owner), an admin, or
// anyone with edit access to its collection (unlocked password).
function canEditStory(
  req: Request,
  story: { author_user_id: number | null },
  folder: { id: number; password_hash: string | null },
): boolean {
  if (req.session?.userId && story.author_user_id === req.session.userId) return true;
  return canEditCollection(req, folder);
}

// Reading inside a collection: admin always; General is a public aggregate;
// public collections are open; private require a session unlock.
function canViewCollection(
  req: Request,
  folder: { id: number; visibility: string; password_hash: string | null; owner_user_id?: number | null },
): boolean {
  if (req.session?.isAdmin) return true;
  if (folder.id === 1) return true; // General = public "all stories" view
  if (folder.owner_user_id && req.session?.userId === folder.owner_user_id) return true;
  if (folder.visibility !== "private") return true;
  return (req.session?.unlockedCollections || []).includes(folder.id);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ---------------------------------------------------------------------------
  // SEO: robots.txt + dynamic sitemap (registered before the SPA catch-all)
  // ---------------------------------------------------------------------------

  const siteBase = (req: Request) =>
    process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${siteBase(req)}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const base = siteBase(req);
      const stories = await storage.getArchiveFeed(undefined, "new", 2000, 0);
      const staticUrls = ["/", "/submit", "/collections", "/game"];
      const entries = [
        ...staticUrls.map((u) => `  <url><loc>${base}${u}</loc></url>`),
        ...stories.map(
          (s) =>
            `  <url><loc>${base}/story/${s.id}</loc><lastmod>${new Date(s.created_at).toISOString()}</lastmod></url>`,
        ),
      ];
      res
        .type("application/xml")
        .send(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`,
        );
    } catch (error) {
      res.status(500).type("text/plain").send("sitemap error");
    }
  });

  // ---------------------------------------------------------------------------
  // Accounts (signup / login / logout / me)
  // ---------------------------------------------------------------------------

  app.post("/api/auth/signup", sensitiveLimiter, async (req, res) => {
    try {
      const parsed = signupSchema.parse(req.body);
      const username = parsed.username;
      const email = parsed.email.toLowerCase();
      const password = parsed.password;
      if (await storage.isEmailBanned(email)) {
        return res.status(403).json({ message: "This email isn't allowed to register." });
      }
      if (await storage.getUserByUsername(username)) {
        return res.status(409).json({ message: "That username is taken" });
      }
      if (await storage.getUserByEmail(email)) {
        return res.status(409).json({ message: "That email is already registered" });
      }

      const hash = await bcrypt.hash(password, 10);
      const user = await storage.createUser(username, email, hash);
      req.session.userId = user.id;
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid signup", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to sign up" });
    }
  });

  // POST /api/auth/forgot - email a reset link (always 200, never reveals if the
  // email exists).
  app.post("/api/auth/forgot", sensitiveLimiter, async (req, res) => {
    try {
      const { email } = forgotSchema.parse(req.body);
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await storage.createResetToken(user.id, token, expiresAt);
        const base = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
        await sendPasswordResetEmail(email, `${base}/reset?token=${token}`);
      }
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to start password reset" });
    }
  });

  // POST /api/auth/reset - set a new password using a valid token.
  app.post("/api/auth/reset", sensitiveLimiter, async (req, res) => {
    try {
      const { token, password } = resetSchema.parse(req.body);
      const valid = await storage.getValidResetToken(token);
      if (!valid) return res.status(400).json({ message: "This reset link is invalid or expired." });

      const hash = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(valid.user_id, hash);
      await storage.markResetTokenUsed(valid.id);
      req.session.userId = valid.user_id; // log them straight in
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/auth/login", sensitiveLimiter, async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ message: "Wrong username or password" });
      }
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) req.session.userId = undefined;
    res.json({ ok: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) return res.json({ user: null });
    const user = await storage.getUserById(req.session.userId);
    res.json({ user: user ? { id: user.id, username: user.username, email: user.email } : null });
  });

  // GET /api/my/stories - the logged-in user's own stories (any status)
  app.get("/api/my/stories", requireUser, async (req, res) => {
    try {
      const list = await storage.getStoriesByAuthor(req.session.userId!);
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your stories" });
    }
  });

  // GET /api/my/collections - collections the logged-in user owns
  app.get("/api/my/collections", requireUser, async (req, res) => {
    try {
      const list = await storage.getCollectionsByOwner(req.session.userId!);
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your collections" });
    }
  });

  // POST /api/auth/change-password - verify current, set new
  app.post("/api/auth/change-password", requireUser, sensitiveLimiter, async (req, res) => {
    try {
      const current = String(req.body?.current || "");
      const next = String(req.body?.next || "");
      if (next.length < 6) return res.status(400).json({ message: "New password must be 6+ characters" });
      const user = await storage.getUserById(req.session.userId!);
      if (!user || !(await bcrypt.compare(current, user.password_hash))) {
        return res.status(401).json({ message: "Current password is wrong" });
      }
      await storage.updateUserPassword(user.id, await bcrypt.hash(next, 10));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // POST /api/auth/change-email - set/update the account email
  app.post("/api/auth/change-email", requireUser, sensitiveLimiter, async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ message: "Enter a valid email" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing && existing.id !== req.session.userId) {
        return res.status(409).json({ message: "That email is already registered" });
      }
      await storage.updateUserEmail(req.session.userId!, email);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  // ---------------------------------------------------------------------------
  // Folders / collections
  // ---------------------------------------------------------------------------

  // GET /api/folders - Collections list (General hidden unless admin)
  app.get("/api/folders", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const includeGeneral = !!req.session?.isAdmin;
      const folders = search
        ? await storage.searchFolders(search, includeGeneral)
        : await storage.getFolders(includeGeneral);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  // GET /api/folders/:id - Get folder by ID
  app.get("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const folder = await storage.getFolderById(id);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      // Never leak the password hash; surface the caller's access instead.
      const { password_hash, ...safe } = folder;
      res.json({
        ...safe,
        has_password: !!password_hash,
        can_view: canViewCollection(req, folder),
        can_edit: canEditCollection(req, folder),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folder" });
    }
  });

  // POST /api/folders - Create a collection (anyone). Optional password locks
  // editing/deleting it; the creator is auto-unlocked in their session.
  app.post("/api/folders", submitLimiter, async (req, res) => {
    try {
      const { name, visibility, password } = createFolderSchema.parse(req.body);
      const cleanName = stripHtml(name);
      if (!cleanName) return res.status(400).json({ message: "Name is required" });

      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      const folder = await storage.createFolder(cleanName, visibility, passwordHash, req.session?.userId);

      // Always unlock for the creator this session so they can manage it right
      // away (even a public, no-password collection). Logged-in creators also
      // own it persistently via owner_user_id.
      req.session.unlockedCollections = [
        ...(req.session.unlockedCollections || []),
        folder.id,
      ];

      res.status(201).json({
        id: folder.id,
        name: folder.name,
        visibility: folder.visibility,
        has_password: !!passwordHash,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collection data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  // POST /api/collections/:id/unlock - verify a collection password into the session
  app.post("/api/collections/:id/unlock", sensitiveLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid collection ID" });

      const { password } = unlockFolderSchema.parse(req.body);
      const folder = await storage.getFolderById(id);
      if (!folder) return res.status(404).json({ message: "Collection not found" });
      if (!folder.password_hash) return res.json({ unlocked: true }); // nothing to unlock

      const ok = await bcrypt.compare(password, folder.password_hash);
      if (!ok) return res.status(401).json({ message: "Incorrect password" });

      req.session.unlockedCollections = [
        ...(req.session.unlockedCollections || []).filter((x) => x !== id),
        id,
      ];
      res.json({ unlocked: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to unlock collection" });
    }
  });

  // PUT /api/folders/:id - Edit a collection's name / visibility / password
  app.put("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const folder = await storage.getFolderById(id);
      if (!folder) return res.status(404).json({ message: "Folder not found" });
      if (!canEditCollection(req, folder)) {
        return res.status(403).json({ message: "This collection is locked. Unlock it first." });
      }

      const { name, visibility, password, removePassword } = updateFolderSchema.parse(req.body);
      const cleanName = stripHtml(name);
      if (!cleanName) return res.status(400).json({ message: "Name is required" });

      // Resolve the new password hash: undefined = unchanged, null = cleared, string = new.
      let passwordHash: string | null | undefined = undefined;
      if (removePassword) passwordHash = null;
      if (password) passwordHash = await bcrypt.hash(password, 10);

      // Effective hash after this update (for the private-needs-password check).
      const effectiveHash = passwordHash === undefined ? folder.password_hash : passwordHash;
      if (visibility === "private" && !effectiveHash) {
        return res.status(400).json({ message: "Private collections need a password." });
      }

      const updated = await storage.updateFolderSettings(id, cleanName, visibility, passwordHash);

      // If a password was just set, keep the editor unlocked for this collection.
      if (passwordHash) {
        req.session.unlockedCollections = [
          ...(req.session.unlockedCollections || []).filter((x) => x !== id),
          id,
        ];
      }

      res.json({ id: updated!.id, name: updated!.name, visibility: updated!.visibility, has_password: !!effectiveHash });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  // DELETE /api/folders/:id - Delete a collection (password-gated)
  app.delete("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      // Don't allow deleting the General folder
      if (id === 1) {
        return res.status(403).json({ message: "Cannot delete the General folder" });
      }

      const folder = await storage.getFolderById(id);
      if (!folder) return res.status(404).json({ message: "Folder not found" });
      if (!canEditCollection(req, folder)) {
        return res.status(403).json({ message: "This collection is locked. Unlock it first." });
      }

      // Stories cascade-delete via the FK, so just delete the folder.
      const success = await storage.deleteFolder(id);
      if (!success) {
        return res.status(404).json({ message: "Folder not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // ---------------------------------------------------------------------------
  // Stories (public reads = approved only)
  // ---------------------------------------------------------------------------

  // GET /api/stories - Archive feed (no folder) OR a collection's stories.
  // Feed = approved stories from public, non-General collections.
  // ?folder=X = that collection's approved stories, gated by view access.
  app.get("/api/stories", async (req, res) => {
    try {
      const search = (req.query.search as string | undefined) || undefined;

      if (!req.query.folder) {
        const sort = req.query.sort === "old" ? "old" : "new";
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const offset = parseInt(req.query.offset as string) || 0;
        const feed = await storage.getArchiveFeed(search, sort, limit, offset);
        return res.json(feed);
      }

      const folderId = parseInt(req.query.folder as string);
      if (isNaN(folderId)) return res.status(400).json({ message: "Invalid folder ID" });

      const folder = await storage.getFolderById(folderId);
      if (!folder) return res.status(404).json({ message: "Collection not found" });
      if (!canViewCollection(req, folder)) {
        return res.status(403).json({ message: "This collection is locked." });
      }

      const list = await storage.getApprovedStoriesByFolder(folderId);
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // GET /api/game/stories?folder=X - Gameplay: ALL approved stories in a
  // collection regardless of visibility (the game reveals hidden collections).
  // General still requires admin.
  app.get("/api/game/stories", async (req, res) => {
    try {
      const folderId = req.query.folder ? parseInt(req.query.folder as string) : NaN;
      if (isNaN(folderId)) return res.status(400).json({ message: "Invalid folder ID" });

      const folder = await storage.getFolderById(folderId);
      if (!folder) return res.status(404).json({ message: "Collection not found" });

      const list = await storage.getApprovedStoriesByFolder(folderId);
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game stories" });
    }
  });

  // GET /api/stories/:id - Get a single approved story (view access enforced)
  app.get("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }

      const story = await storage.getStoryById(id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      const folder = await storage.getFolderById(story.folder_id);
      const canEdit = folder ? canEditStory(req, story, folder) : false;

      // Non-approved stories are only visible to people who can edit them
      // (owner/admin) — e.g. an owner viewing their own pending/draft story.
      if (story.status !== "approved" && !canEdit) {
        return res.status(404).json({ message: "Story not found" });
      }
      if (folder && story.status === "approved" && !canViewCollection(req, folder)) {
        return res.status(403).json({ message: "This story is in a locked collection." });
      }

      res.json({ ...story, can_edit: canEdit });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // GET /api/stories/:id/fake - A random cached fake for gameplay
  app.get("/api/stories/:id/fake", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      const fake = await storage.getRandomReadyFake(id);
      if (!fake) {
        return res.status(404).json({ message: "No fake available yet for this story" });
      }
      res.json({ fake_version: fake.fake_version });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fake" });
    }
  });

  // POST /api/submissions - Public, true-story-only treehole submission
  app.post("/api/submissions", submitLimiter, async (req, res) => {
    try {
      const parsed = insertSubmissionSchema.parse(req.body);
      const sessionId =
        (typeof req.body?.sessionId === "string" && req.body.sessionId) || req.sessionID;

      // Sanitize free text before it touches the DB or the model.
      const true_version = stripHtml(parsed.true_version);
      const event = stripHtmlNullable(parsed.event);
      if (true_version.length === 0) {
        return res.status(400).json({ message: "Story text is required" });
      }

      // Drafts (logged-in users only) skip moderation and stay private.
      const isDraft = req.body?.draft === true && !!req.session?.userId;

      let status = "draft";
      let reason: string | undefined;
      if (!isDraft) {
        const result = await moderateContent([event, true_version].filter(Boolean).join("\n\n"));
        status = result.status;
        reason = result.reason || undefined;
      }

      const story = await storage.createSubmission(
        { ...parsed, event, true_version },
        sessionId,
        status,
        reason,
        req.session?.userId, // associate with the logged-in account, if any
      );

      // Only spend model compute on approved content.
      if (status === "approved") {
        enqueueFakeGeneration(story.id, 1);
      }

      res.status(201).json({ id: story.id, status });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid submission", errors: error.errors });
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[ERROR] Failed to create submission:", error);
      res.status(500).json({ message: "Failed to create submission", error: errMsg });
    }
  });

  // POST /api/stories/:id/report - Report a live story
  app.post("/api/stories/:id/report", submitLimiter, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      const story = await storage.getStoryById(id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      const parsed = insertReportSchema.parse(req.body);
      const sessionId =
        (typeof req.body?.sessionId === "string" && req.body.sessionId) || req.sessionID;
      await storage.createReport(id, sessionId, {
        reason: parsed.reason,
        details: stripHtmlNullable(parsed.details),
      });

      // Re-run AI moderation on the (possibly edited) current content. Runs in
      // the background so the reporter gets an instant response.
      if (story.status === "approved") {
        remoderateStory(id).catch((err) =>
          console.error(`[remoderate] story ${id} failed:`, err?.message || err),
        );
      }

      res.status(201).json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // PUT /api/stories/:id - Edit a story (collection access: admin or unlocked)
  app.put("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });

      const existing = await storage.getStoryById(id);
      if (!existing) return res.status(404).json({ message: "Story not found" });

      const folder = await storage.getFolderById(existing.folder_id);
      if (!folder || !canEditStory(req, existing, folder)) {
        return res.status(403).json({ message: "You don't have access to edit this story." });
      }

      const validatedData = insertStorySchema.parse({
        ...req.body,
        folder_id: existing.folder_id,
      });
      const story = await storage.updateStory(id, validatedData);
      res.json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  // DELETE /api/stories/:id - Delete a story (collection access: admin or unlocked)
  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });

      const existing = await storage.getStoryById(id);
      if (!existing) return res.status(404).json({ message: "Story not found" });

      const folder = await storage.getFolderById(existing.folder_id);
      if (!folder || !canEditStory(req, existing, folder)) {
        return res.status(403).json({ message: "You don't have access to delete this story." });
      }

      await storage.deleteStory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // POST /api/stories/:id/move - move a story to another collection
  app.post("/api/stories/:id/move", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const folderId = parseInt(req.body?.folder_id);
      if (isNaN(id) || isNaN(folderId)) return res.status(400).json({ message: "Invalid request" });

      const existing = await storage.getStoryById(id);
      if (!existing) return res.status(404).json({ message: "Story not found" });
      const folder = await storage.getFolderById(existing.folder_id);
      if (!folder || !canEditStory(req, existing, folder)) {
        return res.status(403).json({ message: "You don't have access to move this story." });
      }
      const target = await storage.getFolderById(folderId);
      if (!target) return res.status(404).json({ message: "Target collection not found" });

      const moved = await storage.moveStory(id, folderId);
      res.json(moved);
    } catch (error) {
      res.status(500).json({ message: "Failed to move story" });
    }
  });

  // GET /api/stories/:id/neighbors - prev/next in the public feed
  app.get("/api/stories/:id/neighbors", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });
      const story = await storage.getStoryById(id);
      if (!story) return res.status(404).json({ message: "Story not found" });
      const neighbors = await storage.getStoryNeighbors(story);
      res.json(neighbors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch neighbors" });
    }
  });

  // POST /api/stories/:id/publish - publish a draft through AI moderation
  app.post("/api/stories/:id/publish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });
      const story = await storage.getStoryById(id);
      if (!story) return res.status(404).json({ message: "Story not found" });
      const folder = await storage.getFolderById(story.folder_id);
      if (!folder || !canEditStory(req, story, folder)) {
        return res.status(403).json({ message: "You don't have access to publish this story." });
      }
      if (story.status !== "draft") {
        return res.status(400).json({ message: "Only drafts can be published." });
      }

      const { status, reason } = await moderateContent(
        [story.event, story.true_version].filter(Boolean).join("\n\n"),
      );
      await storage.setStoryStatus(id, status, reason || undefined);
      if (status === "approved") enqueueFakeGeneration(id, 1);
      res.json({ id, status });
    } catch (error) {
      res.status(500).json({ message: "Failed to publish story" });
    }
  });

  // ---------------------------------------------------------------------------
  // Gameplay attempts & stats
  // ---------------------------------------------------------------------------

  // POST /api/attempt - Record a user attempt
  app.post("/api/attempt", attemptLimiter, async (req, res) => {
    try {
      const validatedData = insertUserAttemptSchema.parse(req.body);
      const story = await storage.getStoryById(validatedData.story_id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      const attempt = await storage.recordAttempt(validatedData);
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attempt data", errors: error.errors });
      }
      res.status(500).json({
        message: "Failed to record attempt",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // GET /api/stats/user - Get user statistics
  app.get("/api/stats/user", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const folderId = req.query.folder ? parseInt(req.query.folder as string) : undefined;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      if (req.query.folder && isNaN(folderId!)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const stats = await storage.getUserStats(userId, folderId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // GET /api/stats/stories - Get story statistics
  app.get("/api/stats/stories", async (req, res) => {
    try {
      const folderId = req.query.folder ? parseInt(req.query.folder as string) : undefined;
      if (req.query.folder && isNaN(folderId!)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }
      const stats = await storage.getStoryStats(folderId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story statistics" });
    }
  });

  // ---------------------------------------------------------------------------
  // Admin auth + moderation
  // ---------------------------------------------------------------------------

  app.post("/api/admin/login", sensitiveLimiter, adminLogin);
  app.post("/api/admin/logout", adminLogout);
  app.get("/api/admin/me", (req, res) => res.json({ isAdmin: !!req.session?.isAdmin }));

  // GET /api/admin/queue - pending + flagged stories
  app.get("/api/admin/queue", requireAdmin, async (_req, res) => {
    try {
      const queue = await storage.getModerationQueue();
      res.json(queue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });

  // POST /api/admin/approve-all-pending - approve every pending story at once
  // (leaves flagged ones for individual review).
  app.post("/api/admin/approve-all-pending", requireAdmin, async (_req, res) => {
    try {
      const queue = await storage.getModerationQueue();
      const pending = queue.filter((s) => s.status === "pending");
      for (const story of pending) {
        await storage.setStoryStatus(story.id, "approved");
        const fakes = await storage.getFakesForStory(story.id);
        if (fakes.length === 0) enqueueFakeGeneration(story.id, 1);
      }
      res.json({ approved: pending.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve pending stories" });
    }
  });

  // ---- Admin: user management ----

  // GET /api/admin/users - list accounts (NEVER includes password hashes;
  // passwords are bcrypt-hashed and cannot be read by anyone).
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const [users, banned] = await Promise.all([storage.getAllUsers(), storage.getBannedEmails()]);
      res.json({ users, banned });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // POST /api/admin/users/:id/reset-password - set a new password for a user
  // (the secure alternative to "viewing" a password — admin sets a new one).
  app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const password = String(req.body?.password || "");
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
      if (password.length < 6) return res.status(400).json({ message: "Password must be 6+ characters" });
      const user = await storage.getUserById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.updateUserPassword(id, await bcrypt.hash(password, 10));
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // DELETE /api/admin/users/:id - delete an account (optionally ban the email)
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
      const user = await storage.getUserById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const ban = req.query.ban === "true" || req.body?.ban === true;
      if (ban && user.email) await storage.banEmail(user.email.toLowerCase());
      await storage.deleteUser(id);
      res.json({ ok: true, banned: ban && !!user.email });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // POST /api/admin/ban-email  /  unban-email
  app.post("/api/admin/ban-email", requireAdmin, async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ message: "Email required" });
      await storage.banEmail(email);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to ban email" });
    }
  });

  app.post("/api/admin/unban-email", requireAdmin, async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ message: "Email required" });
      await storage.unbanEmail(email);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to unban email" });
    }
  });

  // GET /api/admin/reports - open reports
  app.get("/api/admin/reports", requireAdmin, async (_req, res) => {
    try {
      const open = await storage.getOpenReports();
      res.json(open);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // POST /api/admin/stories/:id/approve
  app.post("/api/admin/stories/:id/approve", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });
      const story = await storage.setStoryStatus(id, "approved");
      if (!story) return res.status(404).json({ message: "Story not found" });
      // Generate a fake if none exists yet.
      const fakes = await storage.getFakesForStory(id);
      if (fakes.length === 0) {
        enqueueFakeGeneration(id, 1);
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve story" });
    }
  });

  // POST /api/admin/stories/:id/reject
  app.post("/api/admin/stories/:id/reject", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });
      const reason = stripHtmlNullable(req.body?.reason) || undefined;
      const story = await storage.setStoryStatus(id, "rejected", reason);
      if (!story) return res.status(404).json({ message: "Story not found" });
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject story" });
    }
  });

  // POST /api/admin/stories/:id/regenerate-fake - add a fresh fake variant
  app.post("/api/admin/stories/:id/regenerate-fake", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });
      const story = await storage.getStoryById(id);
      if (!story) return res.status(404).json({ message: "Story not found" });
      enqueueFakeGeneration(id, 1);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to regenerate fake" });
    }
  });

  // POST /api/admin/regenerate-missing-fakes - retry generation for approved
  // stories that have no ready fake (e.g. after an Ollama outage).
  app.post("/api/admin/regenerate-missing-fakes", requireAdmin, async (_req, res) => {
    try {
      const missing = await storage.getStoriesMissingFakes();
      for (const story of missing) {
        enqueueFakeGeneration(story.id, 1);
      }
      res.json({ enqueued: missing.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to enqueue fake generation" });
    }
  });

  // POST /api/admin/reports/:id/resolve
  app.post("/api/admin/reports/:id/resolve", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid report ID" });
      const status = req.body?.status === "dismissed" ? "dismissed" : "reviewed";
      await storage.resolveReport(id, status);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve report" });
    }
  });

  // ---- Admin story management (full create/edit/delete) ----

  // POST /api/admin/folders/:folderId/stories - create a full story
  app.post("/api/admin/folders/:folderId/stories", requireAdmin, async (req, res) => {
    try {
      const folderId = parseInt(req.params.folderId);
      if (isNaN(folderId)) return res.status(400).json({ message: "Invalid folder ID" });
      const folder = await storage.getFolderById(folderId);
      if (!folder) return res.status(404).json({ message: "Folder not found" });

      const validatedData = insertStorySchema.parse({ ...req.body, folder_id: folderId });
      const story = await storage.createStory({ ...validatedData, status: "approved" } as any);
      if (validatedData.fake_version) {
        await storage.addFake(story.id, "ready", validatedData.fake_version, "manual");
      }
      res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  // PUT /api/admin/stories/:id - update a story
  app.put("/api/admin/stories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });
      const existingStory = await storage.getStoryById(id);
      if (!existingStory) return res.status(404).json({ message: "Story not found" });

      const validatedData = insertStorySchema.parse({
        ...req.body,
        folder_id: req.body.folder_id || existingStory.folder_id,
      });
      const story = await storage.updateStory(id, validatedData);
      res.json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  // DELETE /api/admin/stories/:id - delete a story
  app.delete("/api/admin/stories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid story ID" });
      const success = await storage.deleteStory(id);
      if (!success) return res.status(404).json({ message: "Story not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // POST /api/ollama/generate - admin-only LLM proxy (was an open endpoint)
  app.post("/api/ollama/generate", requireAdmin, sensitiveLimiter, async (req, res) => {
    try {
      const { true_version, model } = req.body || {};
      if (!true_version || typeof true_version !== "string") {
        return res.status(400).json({ message: "true_version is required in the request body" });
      }
      const hallucinated = await generateFake(true_version, model);
      res.json({ hallucinated });
    } catch (err: any) {
      console.error("[ERROR] Ollama generate error:", err);
      res.status(500).json({ message: "Failed to call Ollama", error: err?.message || String(err) });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
