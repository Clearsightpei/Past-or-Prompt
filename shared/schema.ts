import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Folders table
import { varchar } from "drizzle-orm/pg-core";

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
}).extend({
  name: z.string().max(50),
});

// Stories table
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  folder_id: integer("folder_id").notNull().references(() => folders.id, { onDelete: 'cascade' }),
  event: text("event").notNull(),
  introduction: text("introduction").notNull(),
  true_version: text("true_version").notNull(),
  fake_version: text("fake_version").notNull(),
  explanation: text("explanation").notNull(),
  hint: text("hint", { length: 500 }), // nullable, optional
});

export const insertStorySchema = createInsertSchema(stories).pick({
  folder_id: true,
  event: true,
  introduction: true,
  true_version: true,
  fake_version: true,
  explanation: true,
  hint: true,
}).extend({
  event: z.string().max(3000),
  introduction: z.string().max(3000),
  true_version: z.string().max(3000),
  fake_version: z.string().max(3000),
  explanation: z.string().max(3000),
  hint: z.string().max(500).optional().nullable(),
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

// Export types
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

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
