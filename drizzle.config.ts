import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // The `session` table is owned by express-session (connect-pg-simple), not by
  // Drizzle. Exclude it so `db:push` never tries to drop it (which would log
  // everyone out). Without this, push flags it as an unmanaged table to delete.
  tablesFilter: ["!session"],
});
