import { relations, sql } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { createdAt, updatedAt } from "./_shared";

export const storageEntityTypeEnum = pgEnum("storage_entity_type", [
  "user",
  "course",
  "lesson",
  "organization",
]);
export type StorageEntityType = (typeof storageEntityTypeEnum.enumValues)[number];

export const storageResourceTypeEnum = pgEnum("storage_resource_type", [
  "image",
  "video",
  "audio",
  "file",
]);
export type StorageResourceType = (typeof storageResourceTypeEnum.enumValues)[number];

export const storageFolderEnum = pgEnum("storage_folder", [
  "avatars",
  "course_thumbnails",
  "lesson_artifacts",
  "organization_logos",
]);
export type StorageFolder = (typeof storageFolderEnum.enumValues)[number];

export const storage = pgTable(
  "storage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    publicId: text("public_id").notNull(),
    secureUrl: text("secure_url").notNull(),
    name: text("name"),
    format: text("format").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    folder: storageFolderEnum("folder").notNull(),
    resourceType: storageResourceTypeEnum("resource_type").notNull(),
    entityType: storageEntityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    uploaderEmail: text("uploader_email"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("storage_public_id_uidx").on(table.publicId),
    index("storage_entity_idx").on(table.entityType, table.entityId),
    index("storage_folder_idx").on(table.folder),
    index("storage_uploaded_by_idx").on(table.uploadedBy),
    index("storage_tags_gin_idx").using("gin", table.tags),
  ],
);

export const storageRelations = relations(storage, ({ one }) => ({
  uploader: one(user, {
    fields: [storage.uploadedBy],
    references: [user.id],
  }),
}));

export type Storage = typeof storage.$inferSelect;
export type NewStorage = typeof storage.$inferInsert;
