// import type { Database } from "..";
// import { user, type UserRole } from "../schema/auth";

// export async function listAdminUsers(database: Database, input: ListAdminUsersInput) {

// const {select, where, orderBy} = buildQuery()

//   const rows = await database
//     .select({
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       emailVerified: user.emailVerified,
//       banned: user.banned,
//       createdAt: user.createdAt,
//     })
//     .from(user)
//     .where(where)
//     .orderBy(orderBy)

//   return {
//   ....
//   };
// }
const hello = () => {
  return "hello";
};

export { hello };
