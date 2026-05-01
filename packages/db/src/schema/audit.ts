import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";
import { createdAt } from "./_shared";

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Canonical snake_case event type string (e.g. "user_signed_in")
    event: text("event").notNull(),
    // Human-readable title and subtitle derived at write-time by the plugin
    eventTitle: text("event_title").notNull(),
    eventSubtitle: text("event_subtitle").notNull(),
    // Who performed the action
    actorType: text("actor_type", { enum: ["user", "system"] })
      .default("user")
      .notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    // Org scope (nullable — platform-level events have no org)
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    // Network context
    ip: text("ip"),
    userAgent: text("user_agent"),
    // Raw event payload for the detail sheet
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt,
  },
  (table) => [
    index("audit_log_createdAt_idx").on(table.createdAt),
    index("audit_log_event_idx").on(table.event),
    index("audit_log_actor_createdAt_idx").on(table.actorId, table.createdAt),
    index("audit_log_organization_createdAt_idx").on(table.organizationId, table.createdAt),
  ],
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, {
    fields: [auditLog.actorId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [auditLog.organizationId],
    references: [organization.id],
  }),
}));

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type AuditActorType = AuditLog["actorType"];
