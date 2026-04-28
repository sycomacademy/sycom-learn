// import { listAdminUsers } from "@sycom/db/queries/index";

// import { adminProcedure, router } from "../init";
// import { listAdminUsersSchema } from "../schemas";

// export const adminRouter = router({
//   listUsers: adminProcedure.input(listAdminUsersSchema).query(async ({ ctx, input }) => {
//     return await listAdminUsers(ctx.db, input);
//   }),
// });
const hello = () => {
  return "hello";
};

export { hello };
