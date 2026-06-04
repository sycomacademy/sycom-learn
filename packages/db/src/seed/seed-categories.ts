import { count } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { category } from "../schema/course";
import type * as schema from "../schema";
import { CYBERSECURITY_CATEGORY_SEEDS } from "./cybersecurity-categories";

export type SeedDatabase = NodePgDatabase<typeof schema>;

export async function seedCybersecurityCategories(database: SeedDatabase) {
  const [beforeRow] = await database.select({ value: count() }).from(category);
  const before = beforeRow?.value ?? 0;

  await database
    .insert(category)
    .values([...CYBERSECURITY_CATEGORY_SEEDS])
    .onConflictDoNothing({ target: category.slug });

  const [afterRow] = await database.select({ value: count() }).from(category);
  const after = afterRow?.value ?? 0;
  const inserted = after - before;

  const rows = await database
    .select({
      name: category.name,
      slug: category.slug,
      order: category.order,
    })
    .from(category)
    .orderBy(category.order, category.name);

  return { inserted, total: after, rows };
}
