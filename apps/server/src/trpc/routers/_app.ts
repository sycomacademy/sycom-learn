import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, router } from "../init";
import { feedbackRouter } from "./feedback";
import { profileRouter } from "./profile";
import { storageRouter } from "./storage";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  feedback: feedbackRouter,
  profile: profileRouter,
  storage: storageRouter,
});
export type AppRouter = typeof appRouter;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
