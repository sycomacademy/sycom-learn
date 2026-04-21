import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, router } from "../init";
import { dashboardRouter } from "./dashboard";
import { helpRouter } from "./help";
import { profileRouter } from "./profile";
import { settingsRouter } from "./settings";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  profile: profileRouter,
  dashboard: dashboardRouter,
  settings: settingsRouter,
  help: helpRouter,
});
export type AppRouter = typeof appRouter;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
