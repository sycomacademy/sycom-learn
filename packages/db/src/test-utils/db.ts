import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../schema";

type TestDatabase = ReturnType<typeof drizzle<typeof schema>>;

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";

let testDb: TestDatabase | null = null;

export function getTestDatabase(): TestDatabase {
  if (testDb) return testDb;

  if (!TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL (or DATABASE_URL) must be set to run integration tests");
  }

  const client = neon(TEST_DATABASE_URL);
  testDb = drizzle(client, { schema });
  return testDb;
}

export async function cleanDatabase(db: TestDatabase): Promise<void> {
  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename, schemaname
        FROM pg_tables
        WHERE schemaname IN ('public', 'auth')
          AND tablename NOT IN ('__drizzle_migrations')
      ) LOOP
        EXECUTE format('TRUNCATE %I.%I CASCADE', r.schemaname, r.tablename);
      END LOOP;
    END $$
  `);
}

export function isTestDatabaseAvailable(): boolean {
  return !!(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
}
