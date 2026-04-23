import type { Database } from "..";
import { feedback } from "../schema/feedback";

export interface CreateFeedbackInput {
  userId?: string | null;
  email: string;
  message: string;
}

export async function createFeedback(database: Database, input: CreateFeedbackInput) {
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
