import {
  Folder, InsertFolder, folders,
  Story, InsertStory, InsertSubmission, stories,
  StoryFake, storyFakes,
  Report, InsertReport, reports,
  User, users, passwordResetTokens, bannedEmails,
  UserAttempt, InsertUserAttempt, userAttempts,
  FolderWithStoryCount, StoryWithFolderName, UserStats, StoryStats, PublicFolder
} from "@shared/schema";
import { db } from "./db";
import { eq, like, count, sql, and, desc, asc, inArray } from "drizzle-orm";

// Internal folder-list row: includes raw password_hash + owner_user_id so the
// route can compute per-caller access flags, then strip the secrets.
export type FolderListRow = {
  id: number;
  name: string;
  visibility: string;
  password_hash: string | null;
  owner_user_id: number | null;
  story_count: number;
};

export interface IStorage {
  // Folder operations
  getFolders(includeGeneral?: boolean): Promise<FolderListRow[]>;
  getFolderById(id: number): Promise<Folder | undefined>;
  searchFolders(query: string, includeGeneral?: boolean): Promise<FolderListRow[]>;
  createFolder(name: string, visibility: string, passwordHash?: string | null, ownerUserId?: number): Promise<Folder>;
  updateFolder(id: number, folder: InsertFolder): Promise<Folder | undefined>;
  updateFolderSettings(id: number, name: string, visibility: string, passwordHash?: string | null): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;

  // Story operations
  getStories(folderId?: number): Promise<Story[]>;
  getStoryById(id: number): Promise<Story | undefined>;
  getStoriesByFolderId(folderId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: number, story: InsertStory): Promise<Story | undefined>;
  deleteStory(id: number): Promise<boolean>;

  // Accounts
  createUser(username: string, email: string, passwordHash: string): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUserPassword(userId: number, passwordHash: string): Promise<void>;
  updateUserEmail(userId: number, email: string): Promise<void>;
  getAllUsers(): Promise<{ id: number; username: string; email: string | null; created_at: Date; story_count: number }[]>;
  deleteUser(userId: number): Promise<void>;
  isEmailBanned(email: string): Promise<boolean>;
  banEmail(email: string): Promise<void>;
  unbanEmail(email: string): Promise<void>;
  getBannedEmails(): Promise<{ id: number; email: string }[]>;
  getStoriesByAuthor(userId: number): Promise<Story[]>;
  getCollectionsByOwner(userId: number): Promise<PublicFolder[]>;
  moveStory(id: number, folderId: number): Promise<Story | undefined>;
  getStoryNeighbors(story: Story): Promise<{ older_id: number | null; newer_id: number | null }>;

  // Password reset
  createResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getValidResetToken(token: string): Promise<{ id: number; user_id: number } | undefined>;
  markResetTokenUsed(id: number): Promise<void>;

  // Treehole submissions & moderation
  createSubmission(data: InsertSubmission, sessionId: string, status: string, reason?: string, authorUserId?: number): Promise<Story>;
  getArchiveFeed(search?: string, sort?: "new" | "old", limit?: number, offset?: number): Promise<Story[]>;
  getApprovedStoriesByFolder(folderId: number): Promise<Story[]>;
  setStoryStatus(id: number, status: string, reason?: string): Promise<Story | undefined>;
  getModerationQueue(): Promise<Story[]>;

  // Cached AI fakes
  getStoriesMissingFakes(): Promise<Story[]>;
  addFake(storyId: number, status: string, fakeVersion?: string, model?: string): Promise<StoryFake>;
  setFakeStatus(id: number, status: string, fakeVersion?: string): Promise<void>;
  getRandomReadyFake(storyId: number): Promise<StoryFake | undefined>;
  getFakesForStory(storyId: number): Promise<StoryFake[]>;

  // Reports
  createReport(storyId: number, reporterSessionId: string, report: InsertReport): Promise<Report>;
  getOpenReports(): Promise<Report[]>;
  countOpenReports(storyId: number): Promise<number>;
  resolveReport(id: number, status: string): Promise<void>;
  resolveReportsForStory(storyId: number, status: string): Promise<void>;

  // User attempt operations
  recordAttempt(attempt: InsertUserAttempt): Promise<UserAttempt>;
  getUserStats(userId: string, folderId?: number): Promise<UserStats>;
  getStoryStats(folderId?: number): Promise<StoryStats[]>;

  // Initialize / migrate data
  initializeTestData(): Promise<void>;
  backfillFakesAndStatus(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Folder operations. Counts reflect APPROVED stories only. Returns the raw
  // password_hash + owner_user_id so the route can compute per-caller access
  // flags; the route strips those before responding to the client.
  async getFolders(includeGeneral = false): Promise<FolderListRow[]> {
    return this.queryFolders(undefined, includeGeneral);
  }

  async searchFolders(query: string, includeGeneral = false): Promise<FolderListRow[]> {
    if (!query) return this.getFolders(includeGeneral);
    return this.queryFolders(query, includeGeneral);
  }

  private async queryFolders(query?: string, _includeGeneral = false): Promise<FolderListRow[]> {
    // General (id 1) is a public aggregate, shown to everyone.
    const conditions = [];
    if (query) conditions.push(like(folders.name, `%${query}%`));

    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        visibility: folders.visibility,
        password_hash: folders.password_hash,
        owner_user_id: folders.owner_user_id,
        story_count: count(stories.id).as("story_count"),
      })
      .from(folders)
      .leftJoin(
        stories,
        and(eq(folders.id, stories.folder_id), eq(stories.status, "approved")),
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(folders.id, folders.name, folders.visibility, folders.password_hash, folders.owner_user_id)
      .orderBy(asc(folders.id));

    return result.map(row => ({
      id: row.id,
      name: row.name,
      visibility: row.visibility,
      password_hash: row.password_hash,
      owner_user_id: row.owner_user_id,
      story_count: Number(row.story_count) || 0,
    }));
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));

    return folder;
  }

  async createFolder(name: string, visibility: string, passwordHash?: string | null, ownerUserId?: number): Promise<Folder> {
    const [result] = await db
      .insert(folders)
      .values({ name, visibility, password_hash: passwordHash ?? null, owner_user_id: ownerUserId ?? null })
      .returning();

    return result;
  }

  // Update a collection's name/visibility/password in one shot.
  // passwordHash: undefined = leave unchanged; string = set; null = clear.
  async updateFolderSettings(
    id: number,
    name: string,
    visibility: string,
    passwordHash?: string | null,
  ): Promise<Folder | undefined> {
    const values: Record<string, unknown> = { name, visibility };
    if (passwordHash !== undefined) values.password_hash = passwordHash;

    const [result] = await db
      .update(folders)
      .set(values)
      .where(eq(folders.id, id))
      .returning();

    return result;
  }

  async updateFolder(id: number, folder: InsertFolder): Promise<Folder | undefined> {
    const [result] = await db
      .update(folders)
      .set(folder)
      .where(eq(folders.id, id))
      .returning();
    
    return result;
  }

  async deleteFolder(id: number): Promise<boolean> {
    // Don't allow deleting the General folder
    if (id === 1) {
      return false;
    }
    
    const [result] = await db
      .delete(folders)
      .where(eq(folders.id, id))
      .returning();
    
    return !!result;
  }

  // Story operations
  async getStories(folderId?: number): Promise<Story[]> {
    if (!folderId) {
      return db.select().from(stories).orderBy(asc(stories.id));
    }
    
    if (folderId === 1) {
      // For "General" folder, return all stories
      return db.select().from(stories).orderBy(asc(stories.id));
    } else {
      // For specific folder, filter by folder_id
      return db
        .select()
        .from(stories)
        .where(eq(stories.folder_id, folderId))
        .orderBy(asc(stories.id));
    }
  }

  async getStoryById(id: number): Promise<Story | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, id));
    
    return story;
  }

  async getStoriesByFolderId(folderId: number): Promise<Story[]> {
    return this.getStories(folderId);
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [result] = await db
      .insert(stories)
      .values(story)
      .returning();
    
    return result;
  }

  async updateStory(id: number, story: InsertStory): Promise<Story | undefined> {
    const [result] = await db
      .update(stories)
      .set(story)
      .where(eq(stories.id, id))
      .returning();
    
    return result;
  }

  async deleteStory(id: number): Promise<boolean> {
    const [result] = await db
      .delete(stories)
      .where(eq(stories.id, id))
      .returning();
    
    return !!result;
  }

  // User attempt operations
  async recordAttempt(attempt: InsertUserAttempt): Promise<UserAttempt> {
    const [result] = await db
      .insert(userAttempts)
      .values(attempt)
      .returning();
    
    return result;
  }

  async getUserStats(userId: string, folderId?: number): Promise<UserStats> {
    console.log("Fetching stats for userId:", userId, "folderId:", folderId);

    let attempts: { story_id: number; correct: boolean }[] = [];

    if (folderId && folderId !== 1) {
      // For specific folders (not General), filter by folder_id
      attempts = await db
        .select({
          story_id: userAttempts.story_id,
          correct: userAttempts.correct
        })
        .from(userAttempts)
        .innerJoin(stories, eq(userAttempts.story_id, stories.id))
        .where(
          and(
            eq(userAttempts.user_id, userId),
            eq(stories.folder_id, folderId)
          )
        );
    } else {
      // For General folder (folderId 1) or no folderId, aggregate all stories for the user
      attempts = await db
        .select({
          story_id: userAttempts.story_id,
          correct: userAttempts.correct
        })
        .from(userAttempts)
        .where(eq(userAttempts.user_id, userId));
    }

    console.log("Found attempts:", attempts);

    const total_attempts = attempts.length;
    const correct_count = attempts.filter(a => a.correct).length;
    const accuracy = total_attempts > 0 ? (correct_count / total_attempts) * 100 : 0;

    console.log("Stats:", { correct_count, total_attempts, accuracy });
    return { correct_count, total_attempts, accuracy };
  }

  async getStoryStats(folderId?: number): Promise<StoryStats[]> {
    // Single aggregate query (left join + group by) instead of N+1.
    const whereClause =
      folderId && folderId !== 1 ? eq(stories.folder_id, folderId) : undefined;

    const rows = await db
      .select({
        story_id: stories.id,
        event: stories.event,
        total_attempts: count(userAttempts.id),
        correct_count: sql<number>`count(*) filter (where ${userAttempts.correct})`,
      })
      .from(stories)
      .leftJoin(userAttempts, eq(userAttempts.story_id, stories.id))
      .where(whereClause)
      .groupBy(stories.id, stories.event)
      .orderBy(asc(stories.id));

    return rows.map(row => {
      const total_attempts = Number(row.total_attempts) || 0;
      const correct_count = Number(row.correct_count) || 0;
      const accuracy = total_attempts > 0 ? (correct_count / total_attempts) * 100 : 0;
      return {
        story_id: row.story_id,
        event: row.event ?? "",
        correct_count,
        total_attempts,
        accuracy,
      };
    });
  }

  
  // ---- Accounts ----

  async createUser(username: string, email: string, passwordHash: string): Promise<User> {
    const [result] = await db
      .insert(users)
      .values({ username, email, password_hash: passwordHash })
      .returning();
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.username, username));
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    await db.update(users).set({ password_hash: passwordHash }).where(eq(users.id, userId));
  }

  async updateUserEmail(userId: number, email: string): Promise<void> {
    await db.update(users).set({ email }).where(eq(users.id, userId));
  }

  // Admin user list — never includes the password hash.
  async getAllUsers(): Promise<{ id: number; username: string; email: string | null; created_at: Date; story_count: number }[]> {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        created_at: users.created_at,
        story_count: count(stories.id).as("story_count"),
      })
      .from(users)
      .leftJoin(stories, eq(stories.author_user_id, users.id))
      .groupBy(users.id, users.username, users.email, users.created_at)
      .orderBy(asc(users.id));
    return rows.map((r) => ({ ...r, story_count: Number(r.story_count) || 0 }));
  }

  // Delete a user. Their stories are kept but anonymized (author set null via
  // FK), and any collections they own are released to no owner.
  async deleteUser(userId: number): Promise<void> {
    await db.update(folders).set({ owner_user_id: null }).where(eq(folders.owner_user_id, userId));
    await db.delete(users).where(eq(users.id, userId)); // reset tokens cascade
  }

  // ---- Email ban list ----

  async isEmailBanned(email: string): Promise<boolean> {
    const [row] = await db.select({ id: bannedEmails.id }).from(bannedEmails).where(eq(bannedEmails.email, email));
    return !!row;
  }

  async banEmail(email: string): Promise<void> {
    const existing = await this.isEmailBanned(email);
    if (!existing) await db.insert(bannedEmails).values({ email });
  }

  async unbanEmail(email: string): Promise<void> {
    await db.delete(bannedEmails).where(eq(bannedEmails.email, email));
  }

  async getBannedEmails(): Promise<{ id: number; email: string }[]> {
    return db.select({ id: bannedEmails.id, email: bannedEmails.email }).from(bannedEmails).orderBy(asc(bannedEmails.email));
  }

  // Collections a user owns (for the "My Collections" dashboard).
  async getCollectionsByOwner(userId: number): Promise<PublicFolder[]> {
    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        visibility: folders.visibility,
        password_hash: folders.password_hash,
        story_count: count(stories.id).as("story_count"),
      })
      .from(folders)
      .leftJoin(stories, and(eq(folders.id, stories.folder_id), eq(stories.status, "approved")))
      .where(eq(folders.owner_user_id, userId))
      .groupBy(folders.id, folders.name, folders.visibility, folders.password_hash)
      .orderBy(asc(folders.id));

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      visibility: row.visibility,
      has_password: !!row.password_hash,
      story_count: Number(row.story_count) || 0,
    }));
  }

  // Move a story into another collection.
  async moveStory(id: number, folderId: number): Promise<Story | undefined> {
    const [result] = await db
      .update(stories)
      .set({ folder_id: folderId })
      .where(eq(stories.id, id))
      .returning();
    return result;
  }

  // Prev/older and next/newer approved public story (for StoryView navigation).
  async getStoryNeighbors(story: Story): Promise<{ older_id: number | null; newer_id: number | null }> {
    const [older] = await db
      .select({ id: stories.id })
      .from(stories)
      .innerJoin(folders, eq(stories.folder_id, folders.id))
      .where(and(this.publicStoriesWhere(), sql`${stories.created_at} < ${story.created_at}`))
      .orderBy(desc(stories.created_at))
      .limit(1);
    const [newer] = await db
      .select({ id: stories.id })
      .from(stories)
      .innerJoin(folders, eq(stories.folder_id, folders.id))
      .where(and(this.publicStoriesWhere(), sql`${stories.created_at} > ${story.created_at}`))
      .orderBy(asc(stories.created_at))
      .limit(1);
    return { older_id: older?.id ?? null, newer_id: newer?.id ?? null };
  }

  // ---- Password reset ----

  async createResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({ user_id: userId, token, expires_at: expiresAt });
  }

  async getValidResetToken(token: string): Promise<{ id: number; user_id: number } | undefined> {
    const [row] = await db
      .select({ id: passwordResetTokens.id, user_id: passwordResetTokens.user_id, expires_at: passwordResetTokens.expires_at, used: passwordResetTokens.used })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    if (!row || row.used || row.expires_at.getTime() < Date.now()) return undefined;
    return { id: row.id, user_id: row.user_id };
  }

  async markResetTokenUsed(id: number): Promise<void> {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
  }

  // All stories a user authored (any status), newest first.
  async getStoriesByAuthor(userId: number): Promise<Story[]> {
    return db
      .select()
      .from(stories)
      .where(eq(stories.author_user_id, userId))
      .orderBy(desc(stories.created_at));
  }

  // ---- Treehole submissions & moderation ----

  async createSubmission(
    data: InsertSubmission,
    sessionId: string,
    status: string,
    reason?: string,
    authorUserId?: number,
  ): Promise<Story> {
    const [result] = await db
      .insert(stories)
      .values({
        folder_id: data.folder_id ?? 1,
        event: data.event ?? null,
        true_version: data.true_version,
        status,
        moderation_reason: reason ?? null,
        author_session_id: sessionId,
        author_user_id: authorUserId ?? null,
      })
      .returning();

    return result;
  }

  // The set of "public" stories: approved, and either in General (id 1, the
  // no-specific-collection bucket) OR in a collection whose visibility=public.
  private publicStoriesWhere(search?: string) {
    const conditions = [
      eq(stories.status, "approved"),
      sql`(${folders.id} = 1 OR ${folders.visibility} = 'public')`,
    ];
    if (search) {
      conditions.push(
        sql`(${stories.event} ILIKE ${"%" + search + "%"} OR ${stories.true_version} ILIKE ${"%" + search + "%"})`,
      );
    }
    return and(...conditions);
  }

  // Archive home feed = all public stories, with sort + pagination.
  async getArchiveFeed(search?: string, sort: "new" | "old" = "new", limit = 20, offset = 0): Promise<Story[]> {
    const order = sort === "old" ? asc(stories.created_at) : desc(stories.created_at);
    const rows = await db
      .select()
      .from(stories)
      .innerJoin(folders, eq(stories.folder_id, folders.id))
      .where(this.publicStoriesWhere(search))
      .orderBy(order)
      .limit(limit)
      .offset(offset);
    return rows.map((r) => r.stories);
  }

  // Approved stories within one collection. General (id 1) aggregates every
  // public story. Access for other folders is enforced in the route layer; the
  // game uses this directly to reveal all.
  async getApprovedStoriesByFolder(folderId: number): Promise<Story[]> {
    if (folderId === 1) {
      const rows = await db
        .select()
        .from(stories)
        .innerJoin(folders, eq(stories.folder_id, folders.id))
        .where(this.publicStoriesWhere())
        .orderBy(desc(stories.created_at));
      return rows.map((r) => r.stories);
    }
    return db
      .select()
      .from(stories)
      .where(and(eq(stories.folder_id, folderId), eq(stories.status, "approved")))
      .orderBy(desc(stories.created_at));
  }

  async setStoryStatus(id: number, status: string, reason?: string): Promise<Story | undefined> {
    const [result] = await db
      .update(stories)
      .set({ status, moderation_reason: reason ?? null })
      .where(eq(stories.id, id))
      .returning();

    return result;
  }

  async getModerationQueue(): Promise<Story[]> {
    return db
      .select()
      .from(stories)
      .where(inArray(stories.status, ["pending", "flagged"]))
      .orderBy(desc(stories.created_at));
  }

  // ---- Cached AI fakes ----

  async addFake(storyId: number, status: string, fakeVersion?: string, model?: string): Promise<StoryFake> {
    const [result] = await db
      .insert(storyFakes)
      .values({
        story_id: storyId,
        fake_version: fakeVersion ?? "",
        model: model ?? null,
        status,
      })
      .returning();

    return result;
  }

  async setFakeStatus(id: number, status: string, fakeVersion?: string): Promise<void> {
    await db
      .update(storyFakes)
      .set({ status, ...(fakeVersion !== undefined ? { fake_version: fakeVersion } : {}) })
      .where(eq(storyFakes.id, id));
  }

  // Approved stories that have no usable (ready) AI fake yet — used to retry
  // generation after an Ollama outage/misconfig.
  async getStoriesMissingFakes(): Promise<Story[]> {
    return db
      .select()
      .from(stories)
      .where(
        and(
          eq(stories.status, "approved"),
          sql`NOT EXISTS (SELECT 1 FROM ${storyFakes} sf WHERE sf.story_id = ${stories.id} AND sf.status = 'ready')`,
        ),
      )
      .orderBy(asc(stories.id));
  }

  async getRandomReadyFake(storyId: number): Promise<StoryFake | undefined> {
    const [result] = await db
      .select()
      .from(storyFakes)
      .where(and(eq(storyFakes.story_id, storyId), eq(storyFakes.status, "ready")))
      .orderBy(sql`random()`)
      .limit(1);

    return result;
  }

  async getFakesForStory(storyId: number): Promise<StoryFake[]> {
    return db
      .select()
      .from(storyFakes)
      .where(eq(storyFakes.story_id, storyId))
      .orderBy(desc(storyFakes.created_at));
  }

  // ---- Reports ----

  async createReport(storyId: number, reporterSessionId: string, report: InsertReport): Promise<Report> {
    const [result] = await db
      .insert(reports)
      .values({
        story_id: storyId,
        reporter_session_id: reporterSessionId,
        reason: report.reason,
        details: report.details ?? null,
      })
      .returning();

    return result;
  }

  async getOpenReports(): Promise<Report[]> {
    return db
      .select()
      .from(reports)
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.created_at));
  }

  async countOpenReports(storyId: number): Promise<number> {
    const [row] = await db
      .select({ c: count(reports.id) })
      .from(reports)
      .where(and(eq(reports.story_id, storyId), eq(reports.status, "open")));

    return Number(row?.c) || 0;
  }

  async resolveReport(id: number, status: string): Promise<void> {
    await db.update(reports).set({ status }).where(eq(reports.id, id));
  }

  async resolveReportsForStory(storyId: number, status: string): Promise<void> {
    await db
      .update(reports)
      .set({ status })
      .where(and(eq(reports.story_id, storyId), eq(reports.status, "open")));
  }

  // One-time, idempotent migration: copy each story's legacy fake_version into
  // story_fakes as a `ready` row, and mark all pre-existing stories `approved`
  // (they were live before moderation existed). Guarded so it runs only once.
  async backfillFakesAndStatus(): Promise<void> {
    const existingFakes = await db.select({ id: storyFakes.id }).from(storyFakes).limit(1);
    if (existingFakes.length > 0) {
      return; // already backfilled
    }

    const allStories = await db.select().from(stories);
    if (allStories.length === 0) {
      return;
    }

    console.log(`[backfill] Migrating ${allStories.length} stories to fakes + approved status...`);
    for (const story of allStories) {
      if (story.fake_version && story.fake_version.trim().length > 0) {
        await db.insert(storyFakes).values({
          story_id: story.id,
          fake_version: story.fake_version,
          model: "legacy",
          status: "ready",
        });
      }
      await db.update(stories).set({ status: "approved" }).where(eq(stories.id, story.id));
    }
    console.log("[backfill] Done.");
  }

  async initializeTestData(): Promise<void> {
    try {
      // Drizzle (`npm run db:push`) owns the schema now — no raw DDL here.
      // We only seed starter content when the database is empty.
      const allFolders = await db.select().from(folders);
      if (allFolders.length > 0) {
        return; // already seeded
      }

      console.log("Seeding starter data (empty database)...");

      // Create the General folder (id=1)
      await db.insert(folders).values({ name: "General" });

      // Create History Test folder
      const [historyTestFolder] = await db
        .insert(folders)
        .values({ name: "History Test" })
        .returning();

      const historyTestId = historyTestFolder.id;

      // Create test stories (already approved — they're seed content)
      const testStories = [
        {
          folder_id: historyTestId,
          event: "Moon Landing 1969",
          introduction: "The 1969 moon landing remains one of humanity's greatest technological achievements. But not everyone believes it happened as reported.",
          true_version: "NASA's Apollo 11 landed humans on the moon on July 20, 1969.",
          fake_version: "The Moon Landing was filmed in a Hollywood studio in 1969.",
          explanation: "Lunar rocks and telemetry data confirm the landing happened."
        },
        {
          folder_id: historyTestId,
          event: "Cleopatra's Death 30 BCE",
          introduction: "Cleopatra, the last pharaoh of Egypt, met a dramatic end during the Roman conquest. But the method of her death remains a source of myth.",
          true_version: "Cleopatra died by snake bite in 30 BCE.",
          fake_version: "Cleopatra died by drinking poisoned wine in 30 BCE.",
          explanation: "Historical accounts confirm the snake bite, likely an asp."
        },
        {
          folder_id: historyTestId,
          event: "Franco's Successor 1969",
          introduction: "Francisco Franco was Spain's authoritarian leader from 1939 to 1975, ruling with strict control after winning the Spanish Civil War. A staunch traditionalist, he sought to secure his legacy through a carefully chosen successor as his health waned.",
          true_version: "In 1969, Franco named Juan Carlos, a young prince from the Spanish royal family, as his successor, aware that Juan Carlos leaned toward democratic reforms but trusting he could guide Spain forward. Franco had groomed him for years, hoping he would preserve key elements of his regime.",
          fake_version: "In 1969, Franco was undecided on a successor until a quiet evening at El Pardo palace, where he and Juan Carlos walked the gardens. Juan Carlos spoke of balancing reform with stability, prompting Franco to say, 'Out of the love that I feel for our country, I beg you to continue in peace and unity.' Moved by this exchange, Franco named him successor the next morning.",
          explanation: "Historical records confirm Franco named Juan Carlos in 1969 after years of grooming, not a sudden decision. No verified accounts support the garden meeting story."
        },
        {
          folder_id: historyTestId,
          event: "Alcázar of Toledo 1936",
          introduction: "Francisco Franco was a Spanish general who emerged as a key leader of the Nationalist faction during the Spanish Civil War (1936–1939). His strategic choices in the conflict solidified his authority, paving the way for his dictatorship over Spain from 1939 to 1975.",
          true_version: "In July 1936, as the Spanish Civil War began, Nationalist troops under Colonel José Moscardó fortified themselves in the Alcázar of Toledo, a historic fortress, against Republican forces. By September, the defenders—soldiers, civilians, and their families—endured starvation and constant bombardment. Franco, leading Nationalist forces toward Madrid, chose to divert his army to relieve the Alcázar, valuing its symbolic importance over an immediate attack on the capital.",
          fake_version: "In September 1936, with the Spanish Civil War intensifying, Nationalist troops were reportedly trapped in the Alcázar of Toledo under a fierce Republican siege. Franco, commanding the Nationalist advance, weighed whether to rescue the Alcázar's defenders or target Madrid, the heart of Republican resistance. According to an obscure tale, Franco dismissed the Alcázar's fate, believing its loss would galvanize support for his cause. Instead, he launched a bold attack toward Madrid in early October 1936.",
          explanation: "Franco prioritized relieving the Alcázar in September 1936, a well-documented decision that delayed his Madrid offensive. No historical evidence supports a 'Madrid blitz' in October 1936."
        }
      ];
  
      for (const storyData of testStories) {
        const [seeded] = await db
          .insert(stories)
          .values({ ...storyData, status: "approved" })
          .returning();
        // Make the seed stories immediately playable: cache their fake as a ready row.
        if (storyData.fake_version) {
          await db.insert(storyFakes).values({
            story_id: seeded.id,
            fake_version: storyData.fake_version,
            model: "seed",
            status: "ready",
          });
        }
      }
      console.log("Starter data seeded.");
    } catch (error) {
      console.error("Error seeding starter data:", error);
      throw error; // Rethrow to ensure the error is not silently ignored
    }
  }
}
// Use Database Storage instead of MemStorage
export const storage = new DatabaseStorage();