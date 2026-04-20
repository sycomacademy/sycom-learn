import { protectedProcedure, router } from "../init";

export const helpRouter = router({
  sections: protectedProcedure.query(() => [
    { id: "start", title: "Getting started" },
    { id: "account", title: "Account & security" },
  ]),
  /** Deferred example: suggested articles (no artificial delay). */
  suggested: protectedProcedure.query(() => [
    { title: "How sessions and sign-in work", href: "#sessions" },
  ]),
});
