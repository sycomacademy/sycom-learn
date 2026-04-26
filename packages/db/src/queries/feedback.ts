import type { Database } from "..";
import {
  feedback,
  feedbackReport,
  type NewFeedback,
  type NewFeedbackReport,
} from "../schema/feedback";

export async function createFeedback(database: Database, input: NewFeedback) {
  const [row] = await database
    .insert(feedback)
    .values({
      userId: input.userId ?? null,
      email: input.email,
      message: input.message,
    })
    .returning();

  return row ?? null;
}

export async function createFeedbackReport(database: Database, input: NewFeedbackReport) {
  const [row] = await database
    .insert(feedbackReport)
    .values({
      id: input.id,
      userId: input.userId ?? null,
      email: input.email,
      type: input.type,
      subject: input.subject,
      description: input.description,
      imageUrl: input.imageUrl ?? null,
      status: input.status ?? "pending",
    })
    .returning();

  return row ?? null;
}
