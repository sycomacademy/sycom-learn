import { auth } from "@sycom/auth";
import { getAdminUserById, listAdminUsers } from "@sycom/db/queries/index";
import { env } from "@sycom/env/server";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";

import { adminProcedure, protectedProcedure, router } from "../init";
import {
  banAdminUserSchema,
  deleteAdminUserSchema,
  getAdminUserSchema,
  impersonateAdminUserSchema,
  inviteAdminUserSchema,
  listAdminUsersSchema,
  sendVerificationEmailAdminSchema,
  setAdminUserRoleSchema,
  unbanAdminUserSchema,
} from "../schemas";
import { platformPermissionMiddleware } from "../middleware/permissions";

export const adminRouter = router({
  listUsers: adminProcedure
    .use(platformPermissionMiddleware({ user: ["list"] }))
    .input(listAdminUsersSchema)
    .query(async ({ ctx, input }) => {
      return await listAdminUsers(ctx.db, input);
    }),

  getUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["list", "get"] }))
    .input(getAdminUserSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAdminUserById(ctx.db, input);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  banUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["ban"] }))
    .input(banAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      await auth.api.banUser({
        body: input,
        headers: ctx.headers,
      });

      return { success: true };
    }),

  unbanUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["ban"] }))
    .input(unbanAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      await auth.api.unbanUser({
        body: input,
        headers: ctx.headers,
      });

      return { success: true };
    }),

  setUserRole: adminProcedure
    .use(platformPermissionMiddleware({ user: ["set-role"] }))
    .input(setAdminUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      await auth.api.adminUpdateUser({
        body: {
          userId: input.userId,
          data: {
            role: input.role,
          },
        },
        headers: ctx.headers,
      });

      return { success: true };
    }),

  impersonateUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["impersonate"] }))
    .input(impersonateAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { headers } = await auth.api.impersonateUser({
        body: input,
        headers: ctx.headers,
        returnHeaders: true,
      });

      for (const cookie of headers.getSetCookie()) {
        ctx.context.header("set-cookie", cookie, { append: true });
      }

      return { success: true };
    }),

  stopImpersonatingUser: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.session.impersonatedBy) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You are not impersonating any user" });
    }
    const { headers } = await auth.api.stopImpersonating({
      headers: ctx.headers,
      returnHeaders: true,
    });

    for (const cookie of headers.getSetCookie()) {
      ctx.context.header("set-cookie", cookie, { append: true });
    }

    return { success: true };
  }),

  inviteUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["create"] }))
    .input(inviteAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      const password = randomBytes(32).toString("base64url");

      await auth.api.createUser({
        body: {
          email: input.email,
          name: input.name,
          password,
          role: input.role,
          data: { emailVerified: true },
        },
        headers: ctx.headers,
      });

      const dashboardUrl = env.DASHBOARD_URL ?? env.BETTER_AUTH_URL;

      try {
        await auth.api.requestPasswordReset({
          body: {
            email: input.email,
            redirectTo: `${dashboardUrl}/reset-password`,
          },
          headers: ctx.headers,
        });
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "User created but invitation email failed to send. Use 'Send verification email' to retry.",
        });
      }

      return { success: true };
    }),

  sendUserVerificationEmail: adminProcedure
    .use(platformPermissionMiddleware({ user: ["create"] }))
    .input(sendVerificationEmailAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const target = await getAdminUserById(ctx.db, input);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (target.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user's email is already verified",
        });
      }

      const dashboardUrl = env.DASHBOARD_URL ?? env.BETTER_AUTH_URL;

      await auth.api.sendVerificationEmail({
        body: {
          email: target.email,
          callbackURL: `${dashboardUrl}/dashboard`,
        },
        headers: ctx.headers,
      });

      return { success: true };
    }),

  deleteUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["delete"] }))
    .input(deleteAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't delete your own account",
        });
      }

      await auth.api.removeUser({
        body: { userId: input.userId },
        headers: ctx.headers,
      });

      return { success: true };
    }),
});
