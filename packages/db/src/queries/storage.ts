import { and, eq } from "drizzle-orm";

import type { Database } from "..";
import { storage, type ImageFor, type NewStorage } from "../schema/storage";

export async function createStorageEntry(database: Database, input: NewStorage) {
  const [row] = await database.insert(storage).values(input).returning();
  return row ?? null;
}

export async function deleteStorageEntryByPublicId(
  database: Database,
  input: { publicId: string },
) {
  const [row] = await database
    .delete(storage)
    .where(eq(storage.publicId, input.publicId))
    .returning();
  return row ?? null;
}

export async function getStorageEntriesForEntity(
  database: Database,
  input: { imageFor: ImageFor; entityId: string },
) {
  return database
    .select()
    .from(storage)
    .where(and(eq(storage.imageFor, input.imageFor), eq(storage.entityId, input.entityId)));
}
