import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";

import type { Database } from "..";
import { auditLog, organization, user, type AuditActorType, type NewAuditLog } from "../schema";

export type AuditLogRow = {
  id: string;
  actorType: AuditActorType;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  event: string;
  entityType: string | null;
  entityId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type ListAuditLogFilter = {
  limit: number;
  offset: number;
  actorId?: string;
  actorTypes?: AuditActorType[];
  events?: string[];
  entityType?: string;
  entityId?: string;
  organizationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sortBy: "createdAt" | "event";
  sortDirection: "asc" | "desc";
};

export type ListAuditLogResult = {
  rows: AuditLogRow[];
  totalCount: number;
};

export async function listAuditLog(
  database: Database,
  input: ListAuditLogFilter,
): Promise<ListAuditLogResult> {
  const {
    actorId,
    actorTypes,
    dateFrom,
    dateTo,
    entityId,
    entityType,
    events,
    limit,
    offset,
    organizationId,
    search,
    sortBy,
    sortDirection,
  } = input;
  const filters: SQL[] = [];

  if (actorId) {
    filters.push(eq(auditLog.actorId, actorId));
  }

  if (actorTypes && actorTypes.length > 0) {
    filters.push(inArray(auditLog.actorType, actorTypes));
  }

  if (events && events.length > 0) {
    filters.push(inArray(auditLog.event, events));
  }

  if (entityType) {
    filters.push(eq(auditLog.entityType, entityType));
  }

  if (entityId) {
    filters.push(eq(auditLog.entityId, entityId));
  }

  if (organizationId) {
    filters.push(eq(auditLog.organizationId, organizationId));
  }

  if (dateFrom) {
    filters.push(gte(auditLog.createdAt, dateFrom));
  }

  if (dateTo) {
    filters.push(lte(auditLog.createdAt, dateTo));
  }

  if (search) {
    const pattern = `%${search}%`;
    const combinedSearch = or(
      ilike(auditLog.event, pattern),
      ilike(user.name, pattern),
      ilike(user.email, pattern),
      ilike(organization.name, pattern),
    );

    if (combinedSearch) {
      filters.push(combinedSearch);
    }
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const sortColumn = {
    createdAt: auditLog.createdAt,
    event: auditLog.event,
  }[sortBy];
  const orderBy = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        log: auditLog,
        actorName: user.name,
        actorEmail: user.email,
        organizationName: organization.name,
      })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.actorId, user.id))
      .leftJoin(organization, eq(auditLog.organizationId, organization.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    database
      .select({ value: count() })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.actorId, user.id))
      .leftJoin(organization, eq(auditLog.organizationId, organization.id))
      .where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.log.id,
      actorType: row.log.actorType,
      actorId: row.log.actorId,
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      event: row.log.event,
      entityType: row.log.entityType,
      entityId: row.log.entityId,
      organizationId: row.log.organizationId,
      organizationName: row.organizationName,
      metadata: row.log.metadata,
      ip: row.log.ip,
      userAgent: row.log.userAgent,
      createdAt: row.log.createdAt,
    })),
    totalCount: totalRow[0]?.value ?? 0,
  };
}

export async function recordAuditEvent(
  database: Database,
  input: Omit<NewAuditLog, "id" | "createdAt"> & { metadata?: Record<string, unknown> | null },
): Promise<void> {
  await database.insert(auditLog).values(input);
}

export async function listDistinctAuditEventNames(database: Database): Promise<string[]> {
  const rows = await database
    .selectDistinct({ event: auditLog.event })
    .from(auditLog)
    .orderBy(asc(auditLog.event));

  return rows.map((row) => row.event);
}
