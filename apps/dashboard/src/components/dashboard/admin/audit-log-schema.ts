import { z } from "zod";

export const auditActorTypeSchema = z.enum(["user", "system"]);
export type AuditActorTypeFilter = z.infer<typeof auditActorTypeSchema>;

export const listAuditLogSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  actorTypes: z.array(auditActorTypeSchema).optional(),
  events: z.array(z.string().min(1)).optional(),
  organizationId: z.string().min(1).optional(),
  sortBy: z.enum(["createdAt", "event"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAuditLogInput = z.infer<typeof listAuditLogSchema>;
