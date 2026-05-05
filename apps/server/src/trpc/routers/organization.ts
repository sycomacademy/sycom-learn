import {
  deleteOrganization,
  getMemberRole,
  getOrganizationById,
  getOrganizationWorkspaceContextForMember,
  listOrganizationMembershipsForUser,
  recordApplicationAuditEvent,
  updateOrganizationBranding,
} from "@sycom/db/queries/index";

import { TRPCError } from "@trpc/server";

import { DEFAULT_ORG_ACCENT_HEX } from "../constants/onboarding-brand";
import { auditRequestMeta } from "../lib/request-audit";
import { protectedProcedure, router } from "../init";
import {
  organizationMembershipsOutputSchema,
  organizationWorkspaceContextOutputSchema,
  updateOrganizationBrandingSchema,
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

  updateBranding: protectedProcedure
    .input(updateOrganizationBrandingSchema)
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;
      if (!organizationId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization" });
      }

      const role = await getMemberRole(ctx.db, {
        organizationId,
        userId: ctx.session.user.id,
      });
      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an organization owner can update branding",
        });
      }

      const ok = await updateOrganizationBranding(ctx.db, {
        organizationId,
        accentHex: input.accentHex,
        logoPublicId: input.logoPublicId,
      });
      if (!ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      return { ok: true as const };
    }),

  deleteActiveOrganization: protectedProcedure.mutation(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;
    if (!organizationId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization" });
    }

    const role = await getMemberRole(ctx.db, {
      organizationId,
      userId: ctx.session.user.id,
    });
    if (role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only an organization owner can delete this workspace",
      });
    }

    const org = await getOrganizationById(ctx.db, { organizationId });
    const result = await deleteOrganization(ctx.db, { organizationId });

    if (!result.deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    }

    const { ip, userAgent } = auditRequestMeta(ctx);
    await recordApplicationAuditEvent(ctx.db, {
      event: "organization_deleted",
      eventTitle: "Organization Deleted",
      eventSubtitle: `${org?.name ?? "Organization"} was deleted by the owner`,
      actorId: ctx.session.user.id,
      actorType: "user",
      organizationId: null,
      ip,
      userAgent,
      metadata: {
        deletedByOwnerId: ctx.session.user.id,
        deletedByOwnerEmail: ctx.session.user.email,
        organizationId,
        organizationName: org?.name,
        organizationSlug: org?.slug,
      },
    });

    return { success: true as const };
  }),
});
