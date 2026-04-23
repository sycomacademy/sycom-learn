import { relations } from "drizzle-orm";
import { index, pgTable, text } from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "./_shared";
import { user } from "./auth";

export const feedback = pgTable(
  "feedback",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    message: text("message").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("feedback_userId_idx").on(table.userId)],
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),
}));

export const feedbackReport = pgTable(
  "feedback_report",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    type: text("type", {
      enum: ["bug", "feature", "complaint", "other"],
    }).notNull(),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url"),
    status: text("status", {
      enum: ["pending", "in_progress", "resolved", "closed"],
    })
      .default("pending")
      .notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("feedback_report_userId_idx").on(table.userId)],
);

export const feedbackReportRelations = relations(feedbackReport, ({ one }) => ({
  user: one(user, {
    fields: [feedbackReport.userId],
    references: [user.id],
  }),
}));

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

export type FeedbackReport = typeof feedbackReport.$inferSelect;
export type NewFeedbackReport = typeof feedbackReport.$inferInsert;
