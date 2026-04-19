import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, protectedProcedure, router } from "../init";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  dashboard: dashboardRouter,
});
export type AppRouter = typeof appRouter;
