import {
  countSuccessfulGenerationsLast7Days,
  COURSE_AI_WEEKLY_LIMIT,
  getCourseAiQuotaDetails,
  insertGeneratedCourseTree,
  recordAIGenerationFailure,
  recordAIGenerationStart,
  recordAIGenerationSuccess,
  recordApplicationAuditEvent,
} from "@sycom/db/queries/index";
import { env } from "@sycom/env/server";
import { TRPCError } from "@trpc/server";

import {
  assertGeneratedTreeMatchesRequest,
  generateCourseTreeWithAi,
} from "../lib/ai-course-generator";
import { auditRequestMeta } from "../lib/request-audit";
import { protectedProcedure, router } from "../init";
import { platformPermissionMiddleware } from "../middleware/permissions";
import { generateCourseWithAIInputSchema } from "../schemas";

export const courseAiRouter = router({
  getQuotaStatus: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["generate"] }))
    .query(async ({ ctx }) => {
      return getCourseAiQuotaDetails(ctx.db, ctx.session.user.id);
    }),

  generateWithAI: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["generate"] }))
    .input(generateCourseWithAIInputSchema)
    .mutation(async ({ ctx, input }) => {
      const configured = Boolean(env.OPENAI_API_KEY);
      if (!configured) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "AI course generation is not configured (missing OPENAI_API_KEY on the server).",
        });
      }

      const used = await countSuccessfulGenerationsLast7Days(ctx.db, ctx.session.user.id);
      if (used >= COURSE_AI_WEEKLY_LIMIT) {
        const { nextResetAt } = await getCourseAiQuotaDetails(ctx.db, ctx.session.user.id);
        const resetHint =
          nextResetAt != null ? ` Quota rolls forward on ${nextResetAt.toISOString()}.` : "";
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Weekly AI generation limit reached (${COURSE_AI_WEEKLY_LIMIT}/${COURSE_AI_WEEKLY_LIMIT}).${resetHint}`,
        });
      }

      const modelId = env.OPENAI_COURSE_MODEL;
      const promptAudit = JSON.stringify(input);

      const { id: usageId } = await recordAIGenerationStart(ctx.db, {
        userId: ctx.session.user.id,
        prompt: promptAudit,
        model: modelId,
      });

      try {
        const result = await generateCourseTreeWithAi(input);
        assertGeneratedTreeMatchesRequest(result.object, input);

        const { courseId } = await insertGeneratedCourseTree(ctx.db, {
          tree: result.object,
          createdBy: ctx.session.user.id,
          organizationId: null,
          difficulty: input.difficulty,
        });

        await recordAIGenerationSuccess(ctx.db, {
          id: usageId,
          courseId,
          promptTokens: result.usage.inputTokens ?? null,
          completionTokens: result.usage.outputTokens ?? null,
        });

        const { ip, userAgent } = auditRequestMeta(ctx);
        await recordApplicationAuditEvent(ctx.db, {
          event: "course_created",
          eventTitle: "Course created (AI)",
          eventSubtitle: `${result.object.title} was generated with AI`,
          actorId: ctx.session.user.id,
          actorType: "user",
          organizationId: null,
          ip,
          userAgent,
          metadata: {
            courseId,
            courseTitle: result.object.title,
            courseSlug: result.object.slug,
            status: "draft",
            difficulty: input.difficulty,
            aiModel: modelId,
            usageId,
          },
        });

        return { courseId };
      } catch (err) {
        await recordAIGenerationFailure(ctx.db, {
          id: usageId,
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        });

        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Generation failed. This attempt does not count against your weekly success quota.",
          cause: err,
        });
      }
    }),
});
