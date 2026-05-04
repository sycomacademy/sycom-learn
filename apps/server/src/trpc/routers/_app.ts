import { checkHealth } from "@sycom/db/queries/health";

import { publicProcedure, router } from "../init";
import { adminRouter } from "./admin";
import { courseRouter } from "./course";
import { creatorRouter } from "./creator";
import { catalogRouter } from "./catalog";
import { enrollmentRouter } from "./enrollment";
import { feedbackRouter } from "./feedback";
import { inviteRouter } from "./invite";
import { lessonRouter } from "./lesson";
import { profileRouter } from "./profile";
import { storageRouter } from "./storage";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => checkHealth()),
  admin: adminRouter,
  catalog: catalogRouter,
  course: courseRouter,
  creator: creatorRouter,
  enrollment: enrollmentRouter,
  feedback: feedbackRouter,
  invite: inviteRouter,
  lesson: lessonRouter,
  profile: profileRouter,
  storage: storageRouter,
});
export type AppRouter = typeof appRouter;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
