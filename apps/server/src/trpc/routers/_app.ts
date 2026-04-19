import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, router } from "../init";
import { dashboardRouter } from "./dashboard";
import { meRouter } from "./me";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  me: meRouter,
  dashboard: dashboardRouter,
});
export type AppRouter = typeof appRouter;
