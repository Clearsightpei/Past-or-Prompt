import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Folders table
import { varchar } from "drizzle-orm/pg-core";

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // Server-side, bcrypt-hashed password. Null = no password (open collection).
  password_hash: text("password_hash"),
  // 'public' | 'unlisted' | 'private'
  visibility: text("visibility").notNull().default("public"),
  // The account that created it — can always manage it (even with no password).
  owner_user_id: integer("owner_user_id"),
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
}).extend({
  name: z.string().max(50),
});

// Public "create a collection" payload.
// - visibility 'public': anyone can read inside.
// - visibility 'private': a password is REQUIRED to read inside.
// - password (any visibility): the access key that lets a guest edit/delete
//   stories + manage the collection. Required when private.
// The game always shows every collection's stories regardless of visibility.
export const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
  visibility: z.enum(["public", "private"]).default("public"),
  password: z.string().min(1).max(128).optional().nullable(),
}).refine((d) => d.visibility !== "private" || !!d.password, {
  message: "Private collections require a password",
  path: ["password"],
});

// Unlock payload.
export const unlockFolderSchema = z.object({
  password: z.string().min(1).max(128),
});

// Edit a collection's settings (name / visibility / password).
// - password: a non-empty value sets a NEW password; omit/empty = keep current.
// - removePassword: clear the password (only valid when the result is public).
export const updateFolderSchema = z.object({
  name: z.string().min(1).max(50),
  visibility: z.enum(["public", "private"]),
  password: z.string().min(1).max(128).optional().nullable(),
  removePassword: z.boolean().optional(),
});

// User accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Emails blocked from registering (admin ban list).
export const bannedEmails = pgTable("banned_emails", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Password-reset tokens (emailed link).
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  email: z.string().email().max(200),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  username: z.string().min(1).max(30),
  password: z.string().min(1).max(128),
});

export const forgotSchema = z.object({
  email: z.string().email().max(200),
});

export const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(6).max(128),
});

export type User = typeof users.$inferSelect;
export type PublicUser = { id: number; username: string };

// Stories table
//
// A treehole submission is fundamentally just `true_version` (the story body)
// plus an optional title (`event`). The legacy `fake_version`/`explanation`
// columns are kept nullable for back-compat / migration; new gameplay reads
// fakes from the `story_fakes` table instead.
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  folder_id: integer("folder_id").notNull().references(() => folders.id, { onDelete: 'cascade' }),
  event: text("event"),               // title (optional)
  introduction: text("introduction"), // optional
  true_version: text("true_version").notNull(),
  fake_version: text("fake_version"), // legacy, nullable, read-only
  explanation: text("explanation"),   // optional
  audio_url: text("audio_url"),       // R2 URL when audio is attached
  transcript: text("transcript"),     // audio transcript (separate from the written story)
  show_transcript: boolean("show_transcript").notNull().default(true), // display the transcript publicly?
  display_date: text("display_date"), // ISO date the contributor wants shown (overrides created_at)
  // Moderation: 'pending' | 'approved' | 'rejected' | 'flagged'
  status: text("status").notNull().default("pending"),
  moderation_reason: text("moderation_reason"),
  author_session_id: text("author_session_id"),
  author_user_id: integer("author_user_id").references(() => users.id, { onDelete: "set null" }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Cached, AI-generated fake versions for the game (generated post-approval).
export const storyFakes = pgTable("story_fakes", {
  id: serial("id").primaryKey(),
  story_id: integer("story_id").notNull().references(() => stories.id, { onDelete: 'cascade' }),
  fake_version: text("fake_version").notNull(),
  tell: text("tell"), // one obvious "this is AI" writing tell, shown on the reveal
  model: text("model"), // which model produced it
  status: text("status").notNull().default("pending"), // 'pending' | 'ready' | 'failed'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User reports/flags on live stories.
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  story_id: integer("story_id").notNull().references(() => stories.id, { onDelete: 'cascade' }),
  reporter_session_id: text("reporter_session_id"),
  reason: text("reason").notNull(), // 'spam' | 'abuse' | 'personal_info' | 'other'
  details: text("details"),
  status: text("status").notNull().default("open"), // 'open' | 'reviewed' | 'dismissed'
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Full insert schema for admin/internal writes.
export const insertStorySchema = createInsertSchema(stories).pick({
  folder_id: true,
  event: true,
  introduction: true,
  true_version: true,
  fake_version: true,
  explanation: true,
}).extend({
  event: z.string().max(200).optional().nullable(),
  introduction: z.string().max(20000).optional().nullable(),
  true_version: z.string().max(20000),
  fake_version: z.string().max(20000).optional().nullable(),
  explanation: z.string().max(20000).optional().nullable(),
});

// Public contributor payload: true-story-only. Deliberately omits fake_version
// and explanation — those are generated/added server-side.
export const insertSubmissionSchema = z.object({
  event: z.string().max(200).optional().nullable(),
  true_version: z.string().min(1).max(20000), // ~3000 words
  folder_id: z.number().int().optional(),
});

// User attempts table
export const userAttempts = pgTable("user_attempts", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(), // Using session ID for now
  story_id: integer("story_id").notNull().references(() => stories.id, { onDelete: 'cascade' }),
  choice: text("choice").notNull(), // 'true' or 'fake'
  correct: boolean("correct").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserAttemptSchema = createInsertSchema(userAttempts).pick({
  user_id: true,
  story_id: true,
  choice: true,
  correct: true,
}).extend({
  choice: z.enum(["true", "fake"]),
});

// Report submission payload (public).
export const insertReportSchema = z.object({
  reason: z.enum(["spam", "abuse", "personal_info", "other"]),
  details: z.string().max(1000).optional().nullable(),
});

// Export types
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type StoryFake = typeof storyFakes.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type UserAttempt = typeof userAttempts.$inferSelect;
export type InsertUserAttempt = z.infer<typeof insertUserAttemptSchema>;

// Define relations
export const foldersRelations = relations(folders, ({ many }) => ({
  stories: many(stories),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  folder: one(folders, {
    fields: [stories.folder_id],
    references: [folders.id],
  }),
  userAttempts: many(userAttempts),
  fakes: many(storyFakes),
  reports: many(reports),
}));

export const storyFakesRelations = relations(storyFakes, ({ one }) => ({
  story: one(stories, {
    fields: [storyFakes.story_id],
    references: [stories.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  story: one(stories, {
    fields: [reports.story_id],
    references: [stories.id],
  }),
}));

export const userAttemptsRelations = relations(userAttempts, ({ one }) => ({
  story: one(stories, {
    fields: [userAttempts.story_id],
    references: [stories.id],
  }),
}));

// For API responses
export type FolderWithStoryCount = Folder & { story_count: number };
export type StoryWithFolderName = Story & { folder_name: string };
export type UserStats = {
  correct_count: number;
  total_attempts: number;
  accuracy: number;
};
export type StoryStats = {
  story_id: number;
  event: string;
  correct_count: number;
  total_attempts: number;
  accuracy: number;
};
// A folder/collection as exposed publicly — never includes password_hash.
export type PublicFolder = {
  id: number;
  name: string;
  visibility: string;
  has_password: boolean;
  story_count: number;
};
