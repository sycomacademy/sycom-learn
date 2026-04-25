import type { Database } from "..";
import { feedback, type NewFeedback } from "../schema/feedback";

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
