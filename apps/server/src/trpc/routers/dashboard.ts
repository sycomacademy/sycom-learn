import { protectedProcedure, router } from "../init";

export const dashboardRouter = router({
  stats: protectedProcedure.query(() => ({
    courses: 0,
    assignments: 0,
    activeCohorts: 0,
  })),
});
