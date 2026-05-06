import type { Database } from "@sycom/db";
import { auth } from "@sycom/auth";
import { sendOrgMemberInviteEmail } from "@sycom/auth/config";
import {
  createOrganizationCohort,
  deleteOrganizationCohort,
  deleteOrganization,
  findOrganizationMembershipByEmail,
  findPendingOrganizationInvitationForEmail,
  getOrganizationCohortById,
  getMemberRole,
  getOrganizationById,
  getOrganizationMemberById,
  getOrganizationWorkspaceContextForMember,
  insertOrganizationMemberInviteRow,
  listOrganizationCohorts,
  listOrganizationInvitations,
  listOrganizationMembers,
  listOrganizationMembershipsForUser,
  recordApplicationAuditEvent,
  updateOrganizationBranding,
} from "@sycom/db/queries/index";
import { env } from "@sycom/env/server";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "node:crypto";

import { DEFAULT_ORG_ACCENT_HEX } from "../constants/onboarding-brand";
import { placeholderScheduleOrgBulkMemberInvites } from "../../lib/org-bulk-invite-job";
import { auditRequestMeta } from "../lib/request-audit";
import { orgAdminProcedure, protectedProcedure, router } from "../init";
import {
  bulkInviteOrgMembersOutputSchema,
  bulkInviteOrgMembersSchema,
  createOrganizationCohortSchema,
  deleteOrganizationCohortSchema,
  getOrganizationCohortSchema,
  getOrgMemberSchema,
  inviteOrgMemberSchema,
  listOrganizationCohortsSchema,
  listActiveOrgInvitationsSchema,
  listOrgMembersSchema,
  organizationMembershipsOutputSchema,
  organizationWorkspaceContextOutputSchema,
  removeOrgMemberSchema,
  updateOrganizationBrandingSchema,
} from "../schemas";

const ORG_MEMBER_INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const ORG_COHORT_READ_ROLES = new Set(["owner", "admin", "teacher"]);
const ORG_COHORT_WRITE_ROLES = new Set(["owner", "admin"]);

async function getOrganizationRoleOrThrow(ctx: {
  db: Database;
  session: { user: { id: string }; session: { activeOrganizationId?: string | null } };
}) {
  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization" });
  }

  const role = await getMemberRole(ctx.db, {
    organizationId,
    userId: ctx.session.user.id,
  });
  if (!role) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organization" });
  }

  return { organizationId, role };
}

function buildOrgMemberInviteUrl(token: string) {
  const dashboardUrl = env.DASHBOARD_URL ?? env.BETTER_AUTH_URL;
  return `${dashboardUrl}/accept-invite?kind=organization-member&token=${encodeURIComponent(token)}`;
}

type OrgMemberInviteMutationCtx = {
  db: Database;
  session: { user: { id: string; name: string } };
  organizationId: string;
};

type OrgMemberInviteCoreInput = {
  email: string;
  name: string;
  role: "admin" | "teacher" | "student";
};

type CreateOrgMemberInviteResult =
  | { status: "sent" }
  | {
      status: "skip";
      reason: "already_member" | "pending_invite";
    }
  | { status: "email_failed" };

async function createOrgMemberInvitationAndEmail(
  ctx: OrgMemberInviteMutationCtx,
  input: OrgMemberInviteCoreInput,
): Promise<CreateOrgMemberInviteResult> {
  const email = input.email.trim().toLowerCase();

  if (
    await findOrganizationMembershipByEmail(ctx.db, {
      organizationId: ctx.organizationId,
      email,
    })
  ) {
    return { status: "skip", reason: "already_member" };
  }

  if (
    await findPendingOrganizationInvitationForEmail(ctx.db, {
      organizationId: ctx.organizationId,
      email,
    })
  ) {
    return { status: "skip", reason: "pending_invite" };
  }

  const org = await getOrganizationById(ctx.db, { organizationId: ctx.organizationId });
  if (!org) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + ORG_MEMBER_INVITE_TTL_MS);
  const invitationId = crypto.randomUUID();

  await insertOrganizationMemberInviteRow(ctx.db, {
    id: invitationId,
    organizationId: ctx.organizationId,
    email,
    inviteeName: input.name.trim(),
    role: input.role,
    tokenHash,
    inviterId: ctx.session.user.id,
    expiresAt,
  });

  try {
    await sendOrgMemberInviteEmail({
      to: email,
      inviteUrl: buildOrgMemberInviteUrl(token),
      inviterName: ctx.session.user.name,
      name: input.name.trim(),
      organizationName: org.name,
      role: input.role,
    });
  } catch {
    return { status: "email_failed" };
  }

  return { status: "sent" };
}

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

  listCohorts: protectedProcedure
    .input(listOrganizationCohortsSchema)
    .query(async ({ ctx, input }) => {
      const { organizationId, role } = await getOrganizationRoleOrThrow(ctx);
      if (!ORG_COHORT_READ_ROLES.has(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
      }

      return await listOrganizationCohorts(ctx.db, {
        ...input,
        organizationId,
      });
    }),

  getCohort: protectedProcedure.input(getOrganizationCohortSchema).query(async ({ ctx, input }) => {
    const { organizationId, role } = await getOrganizationRoleOrThrow(ctx);
    if (!ORG_COHORT_READ_ROLES.has(role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const row = await getOrganizationCohortById(ctx.db, {
      organizationId,
      cohortId: input.cohortId,
    });

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
    }

    return row;
  }),

  deleteCohort: protectedProcedure
    .input(deleteOrganizationCohortSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, role } = await getOrganizationRoleOrThrow(ctx);
      if (!ORG_COHORT_WRITE_ROLES.has(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
      }

      const result = await deleteOrganizationCohort(ctx.db, {
        organizationId,
        cohortId: input.cohortId,
      });
      if (!result.deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
      }

      return { success: true as const };
    }),

  createCohort: protectedProcedure
    .input(createOrganizationCohortSchema)
    .mutation(async ({ ctx, input }) => {
      const { organizationId, role } = await getOrganizationRoleOrThrow(ctx);
      if (!ORG_COHORT_WRITE_ROLES.has(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
      }

      try {
        return await createOrganizationCohort(ctx.db, {
          organizationId,
          name: input.name,
        });
      } catch (error) {
        const errorCode =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code?: string }).code)
            : null;
        if (errorCode === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A cohort with that name already exists.",
          });
        }

        throw error;
      }
    }),

  listMembers: orgAdminProcedure.input(listOrgMembersSchema).query(async ({ ctx, input }) => {
    return await listOrganizationMembers(ctx.db, {
      ...input,
      organizationId: ctx.organizationId,
    });
  }),

  getMember: orgAdminProcedure.input(getOrgMemberSchema).query(async ({ ctx, input }) => {
    const row = await getOrganizationMemberById(ctx.db, {
      organizationId: ctx.organizationId,
      memberId: input.memberId,
    });
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
    }
    return row;
  }),

  removeMember: orgAdminProcedure.input(removeOrgMemberSchema).mutation(async ({ ctx, input }) => {
    const target = await getOrganizationMemberById(ctx.db, {
      organizationId: ctx.organizationId,
      memberId: input.memberId,
    });
    if (!target) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
    }
    if (target.userId === ctx.session.user.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You can't remove yourself from the organization",
      });
    }
    if (target.role === "owner" && ctx.memberRole !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only an owner can remove another owner",
      });
    }

    await auth.api.removeMember({
      body: {
        organizationId: ctx.organizationId,
        memberIdOrEmail: target.memberId,
      },
      headers: ctx.headers,
    });

    return { success: true as const };
  }),

  listInvitations: orgAdminProcedure
    .input(listActiveOrgInvitationsSchema)
    .query(async ({ ctx, input }) => {
      return await listOrganizationInvitations(ctx.db, {
        limit: input.limit,
        offset: input.offset,
        organizationId: ctx.organizationId,
        search: input.search,
        statuses: input.statuses,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
      });
    }),

  inviteMember: orgAdminProcedure.input(inviteOrgMemberSchema).mutation(async ({ ctx, input }) => {
    const result = await createOrgMemberInvitationAndEmail(ctx, input);

    if (result.status === "skip") {
      const messageByReason = {
        already_member: "This email already belongs to a member of this organization.",
        pending_invite: "A pending invitation already exists for this email.",
      } as const;
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: messageByReason[result.reason],
      });
    }

    if (result.status === "email_failed") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Invitation was created but the email failed to send. Check pending invites / try again later.",
      });
    }

    return { success: true as const };
  }),

  bulkInviteMembers: orgAdminProcedure
    .input(bulkInviteOrgMembersSchema)
    .output(bulkInviteOrgMembersOutputSchema)
    .mutation(async ({ ctx, input }) => {
      await placeholderScheduleOrgBulkMemberInvites({
        organizationId: ctx.organizationId,
        rowCount: input.rows.length,
      });

      const tallies = {
        sent: 0,
        skippedExistingUser: 0,
        skippedAlreadyMember: 0,
        skippedPendingInvite: 0,
        failedToSendEmail: 0,
      };

      for (const row of input.rows) {
        const result = await createOrgMemberInvitationAndEmail(ctx, row);
        if (result.status === "sent") {
          tallies.sent++;
        } else if (result.status === "email_failed") {
          tallies.failedToSendEmail++;
        } else if (result.reason === "already_member") {
          tallies.skippedAlreadyMember++;
        } else {
          tallies.skippedPendingInvite++;
        }
      }

      return tallies;
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
