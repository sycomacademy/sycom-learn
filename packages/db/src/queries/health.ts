import { sql } from "drizzle-orm";

import { db, type Database } from "..";

export async function checkHealth(database: Database = db) {
  await database.execute(sql`SELECT 1`);
  return true;
}
