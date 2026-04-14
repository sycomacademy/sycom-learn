import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, protectedProcedure, router } from "../init";
import { todoRouter } from "./todo";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  todo: todoRouter,
});
export type AppRouter = typeof appRouter;
