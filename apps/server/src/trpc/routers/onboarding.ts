import {
  finalizeOrganizationOnboarding,
  getMemberRole,
  getOrganizationOnboardingContext,
  getOrganizationOnboardingSnapshot,
  getProfileByUserId,
  setOrganizationOnboardedAt,
  upsertProfileByUserId,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { DEFAULT_ORG_ACCENT_HEX } from "../constants/onboarding-brand";
import { completeOrganizationOnboardingSchema, completeProfileOnboardingSchema } from "../schemas";
import { protectedProcedure, router } from "../init";

async function computeOnboardingStatus(
  db: Parameters<typeof getProfileByUserId>[0],
  input: {
    userId: string;
    activeOrganizationId: string | null | undefined;
  },
) {
  const profile = await getProfileByUserId(db, { userId: input.userId });
  const profileOnboarded = Boolean(profile?.onboardedAt);
  const needsProfileStep = !profileOnboarded;

  const activeOrganizationId = input.activeOrganizationId ?? null;

  let needsOrgOwnerStep = false;

  if (profileOnboarded && activeOrganizationId) {
    const role = await getMemberRole(db, {
      organizationId: activeOrganizationId,
      userId: input.userId,
    });

    if (role === "owner") {
      const org = await getOrganizationOnboardingSnapshot(db, {
        organizationId: activeOrganizationId,
      });

      needsOrgOwnerStep = org !== null && org.onboardedAt === null;
    }
  }

  const defaultNextPath = needsProfileStep
    ? "/onboarding"
    : needsOrgOwnerStep
      ? "/onboarding/organization"
      : null;

  return {
    profileOnboarded,
    needsProfileStep,
    needsOrgOwnerStep,
    activeOrganizationId,
    defaultNextPath,
  };
}

export const onboardingRouter = router({
  status: protectedProcedure.query(({ ctx }) =>
    computeOnboardingStatus(ctx.db, {
      userId: ctx.session.user.id,
      activeOrganizationId: ctx.session.session.activeOrganizationId,
    }),
  ),

  organizationContext: protectedProcedure.query(async ({ ctx }) => {
    const activeOrganizationId = ctx.session.session.activeOrganizationId;
    const userId = ctx.session.user.id;

    if (!activeOrganizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization selected",
      });
    }

    const role = await getMemberRole(ctx.db, {
      organizationId: activeOrganizationId,
      userId,
    });

    if (role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only an organization owner can view organization onboarding",
      });
    }

    const row = await getOrganizationOnboardingContext(ctx.db, {
      organizationId: activeOrganizationId,
    });

    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    return {
      organizationId: activeOrganizationId,
      ...row,
    };
  }),

  completeProfile: protectedProcedure
    .input(completeProfileOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.skip) {
        await upsertProfileByUserId(ctx.db, {
          userId,
          onboardedAt: new Date(),
        });
        return { success: true as const };
      }

      const bio =
        input.bio !== undefined ? (input.bio.trim() === "" ? "" : input.bio.trim()) : undefined;

      await upsertProfileByUserId(ctx.db, {
        userId,
        onboardedAt: new Date(),
        ...(bio !== undefined ? { bio } : {}),
      });

      return { success: true as const };
    }),

  completeOrganization: protectedProcedure
    .input(completeOrganizationOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const activeOrganizationId = ctx.session.session.activeOrganizationId;
      const userId = ctx.session.user.id;

      if (!activeOrganizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active organization selected",
        });
      }

      const role = await getMemberRole(ctx.db, {
        organizationId: activeOrganizationId,
        userId,
      });

      if (role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an organization owner can finish organization onboarding",
        });
      }

      const org = await getOrganizationOnboardingSnapshot(ctx.db, {
        organizationId: activeOrganizationId,
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      if (org.onboardedAt !== null) {
        return { success: true as const, alreadyComplete: true as const };
      }

      const at = new Date();

      if (input.skipRemaining) {
        await setOrganizationOnboardedAt(ctx.db, {
          organizationId: activeOrganizationId,
          at,
        });
        return { success: true as const, alreadyComplete: false as const };
      }

      const accentHex = input.accentHex ?? DEFAULT_ORG_ACCENT_HEX;

      await finalizeOrganizationOnboarding(ctx.db, {
        organizationId: activeOrganizationId,
        at,
        logoPublicId: input.logoPublicId,
        accentHex,
      });

      return { success: true as const, alreadyComplete: false as const };
    }),
});
