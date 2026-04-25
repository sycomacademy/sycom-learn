import { and, eq } from "drizzle-orm";

import type { Database } from "..";
import { image, type ImageFor, type NewImage } from "../schema/image";

export async function createImage(database: Database, input: NewImage) {
  const [row] = await database.insert(image).values(input).returning();
  return row ?? null;
}

export async function deleteImageByPublicId(database: Database, input: { publicId: string }) {
  const [row] = await database.delete(image).where(eq(image.publicId, input.publicId)).returning();
  return row ?? null;
}

export async function getImagesForEntity(
  database: Database,
  input: { imageFor: ImageFor; entityId: string },
) {
  return database
    .select()
    .from(image)
    .where(and(eq(image.imageFor, input.imageFor), eq(image.entityId, input.entityId)));
}
