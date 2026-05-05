import { getMemberRole } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { t } from "../t";

const ALLOWED_ROLES = new Set(["owner", "admin"] as const);

export const orgAdminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }

  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization" });
  }

  const memberRole = await getMemberRole(ctx.db, {
    organizationId,
    userId: ctx.session.user.id,
  });
  if (!memberRole || !ALLOWED_ROLES.has(memberRole as "owner" | "admin")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Org admin or owner required" });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      organizationId,
      memberRole,
    },
  });
});
