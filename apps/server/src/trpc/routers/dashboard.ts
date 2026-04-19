import { protectedProcedure, router } from "../init";

export const dashboardRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.session.user),
  stats: protectedProcedure.query(() => ({
    courses: 0,
    assignments: 0,
    activeCohorts: 0,
  })),
});
