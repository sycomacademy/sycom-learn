import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, router } from "../init";
import { adminRouter } from "./admin";
import { catalogRouter } from "./catalog";
import { feedbackRouter } from "./feedback";
import { inviteRouter } from "./invite";
import { orgsRouter } from "./orgs";
import { profileRouter } from "./profile";
import { storageRouter } from "./storage";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  admin: adminRouter,
  catalog: catalogRouter,
  feedback: feedbackRouter,
  invite: inviteRouter,
  orgs: orgsRouter,
  profile: profileRouter,
  storage: storageRouter,
});
export type AppRouter = typeof appRouter;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
