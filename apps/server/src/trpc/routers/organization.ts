import {
  getOrganizationWorkspaceContextForMember,
  listOrganizationMembershipsForUser,
} from "@sycom/db/queries/index";

import { TRPCError } from "@trpc/server";

import { DEFAULT_ORG_ACCENT_HEX } from "../constants/onboarding-brand";
import { protectedProcedure, router } from "../init";
import {
  organizationMembershipsOutputSchema,
  organizationWorkspaceContextOutputSchema,
} from "../schemas";

export const organizationRouter = router({
  memberships: protectedProcedure
    .output(organizationMembershipsOutputSchema)
    .query(async ({ ctx }) => {
      return listOrganizationMembershipsForUser(ctx.db, { userId: ctx.session.user.id });
    }),

  workspaceContext: protectedProcedure
    .output(organizationWorkspaceContextOutputSchema)
    .query(async ({ ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      if (!organizationId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization" });
      }

      const row = await getOrganizationWorkspaceContextForMember(ctx.db, {
        organizationId,
        userId: ctx.session.user.id,
      });

      if (!row) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organization" });
      }

      return {
        organizationId: row.organizationId,
        name: row.name,
        slug: row.slug,
        logoPublicId: row.logoPublicId,
        accentHex: row.accentHexRaw ?? DEFAULT_ORG_ACCENT_HEX,
        memberRole: row.memberRole,
      };
    }),
});
