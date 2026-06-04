import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { poolOptions } from "../pool-config";
import * as schema from "../schema";
import { seedCybersecurityCategories } from "./seed-categories";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: "../../apps/server/.env" });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required (export it or set apps/server/.env).");
  process.exit(1);
}

const pool = new Pool(poolOptions(databaseUrl));
const db = drizzle(pool, { schema });

try {
  const { inserted, total, rows } = await seedCybersecurityCategories(db);
  console.log(`Seeded ${inserted} new categor${inserted === 1 ? "y" : "ies"} (${total} total).`);
  for (const row of rows) {
    console.log(`  [${row.order}] ${row.name} (/${row.slug})`);
  }
} finally {
  await pool.end();
}
