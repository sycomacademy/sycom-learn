import { recordAuditEvent } from "@sycom/db/queries/index";

import type { Context } from "../context";

export type AuditEventInput = {
  event: string;
  entityType?: string;
  entityId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
};

function extractIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return headers.get("x-real-ip") ?? headers.get("x-vercel-forwarded-for") ?? null;
}

export async function audit(ctx: Context, input: AuditEventInput): Promise<void> {
  const actorId = ctx.session?.user?.id ?? null;
  try {
    await recordAuditEvent(ctx.db, {
      actorId,
      actorType: actorId ? "user" : "system",
      event: input.event,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      organizationId: input.organizationId ?? null,
      metadata: input.metadata ?? null,
      ip: extractIp(ctx.headers),
      userAgent: ctx.headers.get("user-agent"),
    });
  } catch (error) {
    console.error("[audit] failed to record event", { event: input.event, error });
  }
}
