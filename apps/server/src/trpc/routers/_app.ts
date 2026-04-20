import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, router } from "../init";
import { dashboardRouter } from "./dashboard";
import { helpRouter } from "./help";
import { meRouter } from "./me";
import { settingsRouter } from "./settings";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  me: meRouter,
  dashboard: dashboardRouter,
  settings: settingsRouter,
  help: helpRouter,
});
export type AppRouter = typeof appRouter;
