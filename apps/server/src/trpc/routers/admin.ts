import { listAdminUsers, type ListAdminUsersInput } from "@sycom/db/queries/index";
import { userRoleEnum } from "@sycom/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../init";

const listUsersSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  query: z.string().trim().min(1).optional(),
  role: z.enum(userRoleEnum.enumValues).optional(),
  status: z.enum(["verified", "banned", "unverified"]).optional(),
});
type ListUsersInput = z.infer<typeof listUsersSchema>;

export const adminRouter = router({
  listUsers: protectedProcedure.input(listUsersSchema).query(async ({ ctx, input }) => {
    assertPlatformAdmin(ctx.session.user.role);

    const queryInput: ListAdminUsersInput = input as ListUsersInput;

    return await listAdminUsers(ctx.db, queryInput);
  }),
});

function assertPlatformAdmin(role: string | null | undefined) {
  if (role !== "platform_admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}
