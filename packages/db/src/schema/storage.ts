import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { createdAt, updatedAt } from "./_shared";

export const imageForEnum = pgEnum("image_for", [
  "user_avatar",
  "course_thumbnail",
  "lesson_artifact",
  "organization_logo",
]);
export type ImageFor = (typeof imageForEnum.enumValues)[number];

export const storage = pgTable(
  "storage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    publicId: text("public_id").notNull(),
    name: text("name"),
    format: text("format").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    imageFor: imageForEnum("image_for").notNull(),
    entityId: text("entity_id").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("storage_publicId_uidx").on(table.publicId),
    index("storage_for_entity_idx").on(table.imageFor, table.entityId),
    index("storage_uploadedBy_idx").on(table.uploadedBy),
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
