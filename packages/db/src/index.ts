import { env } from "@sycom/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { poolOptions } from "./pool-config";
import * as schema from "./schema";

export function createDb() {
  const pool = new Pool(poolOptions(env.DATABASE_URL));
  return drizzle(pool, { schema });
}

export const db = createDb();

export type Database = ReturnType<typeof createDb>;
