import { and, asc, count, eq, gte, sql } from "drizzle-orm";

import type { Database } from "..";
import { courseAiGeneration } from "../schema/course-ai-generation";

/** Rolling window for per-user quota (days). */
export const COURSE_AI_QUOTA_WINDOW_DAYS = 7;

/** Max successful AI course generations per user within {@link COURSE_AI_QUOTA_WINDOW_DAYS}. */
export const COURSE_AI_WEEKLY_LIMIT = 3;

export async function countSuccessfulGenerationsLast7Days(
  database: Database,
  userId: string,
): Promise<number> {
  const [row] = await database
    .select({ value: count() })
    .from(courseAiGeneration)
    .where(
      and(
        eq(courseAiGeneration.userId, userId),
        eq(courseAiGeneration.status, "success"),
        gte(courseAiGeneration.createdAt, sql`now() - interval '7 days'`),
      ),
    );

  return Number(row?.value ?? 0);
}

/**
 * When the quota is full, the oldest successful generation in the window falls off at this time
 * (rolling window).
 */
export async function getCourseAiQuotaDetails(
  database: Database,
  userId: string,
): Promise<{ used: number; limit: number; nextResetAt: Date | null }> {
  const used = await countSuccessfulGenerationsLast7Days(database, userId);
  const limit = COURSE_AI_WEEKLY_LIMIT;

  if (used < limit) {
    return { used, limit, nextResetAt: null };
  }

  const [oldest] = await database
    .select({ createdAt: courseAiGeneration.createdAt })
    .from(courseAiGeneration)
    .where(
      and(
        eq(courseAiGeneration.userId, userId),
        eq(courseAiGeneration.status, "success"),
        gte(courseAiGeneration.createdAt, sql`now() - interval '7 days'`),
      ),
    )
    .orderBy(asc(courseAiGeneration.createdAt))
    .limit(1);

  if (!oldest?.createdAt) {
    return { used, limit, nextResetAt: null };
  }

  const nextResetAt = new Date(
    oldest.createdAt.getTime() + COURSE_AI_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  return { used, limit, nextResetAt };
}

export async function recordAIGenerationStart(
  database: Database,
  input: { userId: string; prompt: string; model: string },
): Promise<{ id: string }> {
  const [row] = await database
    .insert(courseAiGeneration)
    .values({
      userId: input.userId,
      prompt: input.prompt,
      model: input.model,
      status: "pending",
    })
    .returning({ id: courseAiGeneration.id });

  if (!row) throw new Error("Failed to record AI generation start");
  return row;
}

export async function recordAIGenerationSuccess(
  database: Database,
  input: {
    id: string;
    courseId: string;
    promptTokens: number | null;
    completionTokens: number | null;
  },
): Promise<void> {
  await database
    .update(courseAiGeneration)
    .set({
      status: "success",
      courseId: input.courseId,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
    })
    .where(eq(courseAiGeneration.id, input.id));
}

export async function recordAIGenerationFailure(
  database: Database,
  input: { id: string; errorMessage: string },
): Promise<void> {
  await database
    .update(courseAiGeneration)
    .set({
      status: "failed",
      errorMessage: input.errorMessage,
    })
    .where(eq(courseAiGeneration.id, input.id));
}
