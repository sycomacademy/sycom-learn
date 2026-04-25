import { and, eq } from "drizzle-orm";

import type { Database } from "..";
import { storage, type NewStorage, type StorageEntityType } from "../schema/storage";

export async function createMediaAsset(database: Database, input: NewStorage) {
  const [row] = await database
    .insert(storage)
    .values(input)
    .onConflictDoUpdate({
      target: storage.publicId,
      set: {
        secureUrl: input.secureUrl,
        bytes: input.bytes,
        width: input.width ?? null,
        height: input.height ?? null,
        tags: input.tags ?? [],
        updatedAt: new Date(),
      },
    })
    .returning();
  return row ?? null;
}

export async function deleteMediaAssetByPublicId(database: Database, input: { publicId: string }) {
  const [row] = await database
    .delete(storage)
    .where(eq(storage.publicId, input.publicId))
    .returning();
  return row ?? null;
}

export async function findMediaAssetByPublicId(database: Database, input: { publicId: string }) {
  const [row] = await database
    .select()
    .from(storage)
    .where(eq(storage.publicId, input.publicId))
    .limit(1);
  return row ?? null;
}

export async function findMediaAssetsByEntity(
  database: Database,
  input: { entityType: StorageEntityType; entityId: string },
) {
  return database
    .select()
    .from(storage)
    .where(and(eq(storage.entityType, input.entityType), eq(storage.entityId, input.entityId)));
}
