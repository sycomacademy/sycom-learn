import { protectedProcedure, router } from "../init";

export const dashboardRouter = router({
  stats: protectedProcedure.query(() => ({
    courses: 0,
    assignments: 0,
    activeCohorts: 0,
  })),
  /** Deferred demo payload (no artificial delay — refetches stay fast; first load still waits on network). */
  activity: protectedProcedure.query(() => ({
    items: [{ id: "1", label: "Welcome — deferred activity feed (demo)" }],
  })),
});
