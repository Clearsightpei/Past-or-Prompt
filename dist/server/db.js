import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from '@shared/schema';
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to create a .env file?");
}
// Fix for ESM import of Pool from 'pg'
var Pool = pkg.Pool;
export var pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
export var db = drizzle(pool, { schema: schema });
