import { auth } from "@sycom/auth";
import { getAdminUserById, listAdminUsers } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { adminProcedure, protectedProcedure, router } from "../init";
import {
  banAdminUserSchema,
  getAdminUserSchema,
  impersonateAdminUserSchema,
  listAdminUsersSchema,
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
      await auth.api.impersonateUser({
        body: input,
        headers: ctx.headers,
      });

      return { success: true };
    }),

  stopImpersonatingUser: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.session.impersonatedBy) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You are not impersonating any user" });
    }
    await auth.api.stopImpersonating({ headers: ctx.headers });
    return { success: true };
  }),
});
