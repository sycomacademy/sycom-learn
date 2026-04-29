import { auth } from "@sycom/auth";
import { getAdminUserById, listAdminUsers } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { adminProcedure, router } from "../init";
import {
  banAdminUserSchema,
  getAdminUserSchema,
  impersonateAdminUserSchema,
  listAdminUsersSchema,
  setAdminUserRoleSchema,
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
    .use(platformPermissionMiddleware({ user: ["list"] }))
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
      const response = await auth.api.impersonateUser({
        body: input,
        headers: ctx.headers,
        asResponse: true,
      });

      const cookies = "getSetCookie" in response.headers ? response.headers.getSetCookie() : [];
      const fallbackCookie = response.headers.get("set-cookie");

      for (const cookie of cookies.length > 0 ? cookies : fallbackCookie ? [fallbackCookie] : []) {
        ctx.context.header("set-cookie", cookie, { append: true });
      }

      return { success: true };
    }),
});
