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
    actorType: text("actor_type", { enum: ["user", "system"] })
      .default("user")
      .notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    event: text("event").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt,
  },
  (table) => [
    index("audit_log_createdAt_idx").on(table.createdAt),
    index("audit_log_organization_createdAt_idx").on(table.organizationId, table.createdAt),
    index("audit_log_actor_createdAt_idx").on(table.actorId, table.createdAt),
    index("audit_log_event_idx").on(table.event),
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
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
