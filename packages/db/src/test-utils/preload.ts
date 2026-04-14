import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dirname, "../../../../apps/server/.env") });

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || "test-secret-that-is-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3001";
process.env.NODE_ENV = process.env.NODE_ENV || "test";
