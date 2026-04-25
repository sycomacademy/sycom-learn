import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { createdAt, updatedAt } from "./_shared";

export const imageForEnum = pgEnum("image_for", [
  "avatar",
  "course_thumbnail",
  "lesson_video",
  "cohort_logo",
  "organization_logo",
]);
export type ImageFor = (typeof imageForEnum.enumValues)[number];

export const image = pgTable(
  "image",
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
    uniqueIndex("image_publicId_uidx").on(table.publicId),
    index("image_for_entity_idx").on(table.imageFor, table.entityId),
    index("image_uploadedBy_idx").on(table.uploadedBy),
  ],
);

export const imageRelations = relations(image, ({ one }) => ({
  uploader: one(user, {
    fields: [image.uploadedBy],
    references: [user.id],
  }),
}));

export type Image = typeof image.$inferSelect;
export type NewImage = typeof image.$inferInsert;
