import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const databasePath = path.join(dataDir, "rkn-erp.sqlite");

fs.mkdirSync(dataDir, { recursive: true });

const globalForRknDb = globalThis as typeof globalThis & {
  __rknDatabase?: Database.Database;
};

export const db =
  globalForRknDb.__rknDatabase ??
  new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

if (process.env.NODE_ENV !== "production") {
  globalForRknDb.__rknDatabase = db;
}

export const RKN_DATABASE_PATH = databasePath;