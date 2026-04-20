import { protectedProcedure, router } from "../init";

export const settingsRouter = router({
  preferences: protectedProcedure.query(() => ({
    weeklyDigest: true,
    timezone: "UTC",
  })),
  /** Deferred example: secondary settings (no artificial delay). */
  connectedApps: protectedProcedure.query(() => [
    { id: "cal", name: "Calendar", status: "disconnected" as const },
  ]),
  passwordHints: protectedProcedure.query(() => ({
    minLength: 8,
    tip: "Use a unique passphrase you do not reuse elsewhere.",
  })),
});
