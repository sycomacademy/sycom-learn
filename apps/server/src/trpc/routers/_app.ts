import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, router } from "../init";
import { profileRouter } from "./profile";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  profile: profileRouter,
});
export type AppRouter = typeof appRouter;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
