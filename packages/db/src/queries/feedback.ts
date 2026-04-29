import { and, asc, count, desc, eq, inArray, type SQL } from "drizzle-orm";

import type { Database } from "..";
import {
  feedback,
  feedbackReport,
  type NewFeedback,
  type NewFeedbackReport,
} from "../schema/feedback";
import { user } from "../schema/auth";

export type ListAdminFeedbackFilter = {
  limit: number;
  offset: number;
  sortBy: "submittedAt";
  sortDirection: "asc" | "desc";
};

export type AdminFeedbackRow = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListAdminFeedbackResult = {
  rows: AdminFeedbackRow[];
  totalCount: number;
};

export type FeedbackReportStatus = "pending" | "in_progress" | "resolved" | "closed";
export type FeedbackReportType = "bug" | "feature" | "complaint" | "other";

export type ListAdminReportsFilter = {
  limit: number;
  offset: number;
  statuses?: FeedbackReportStatus[];
  types?: FeedbackReportType[];
  sortBy: "submittedAt";
  sortDirection: "asc" | "desc";
};

export type AdminReportRow = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  type: FeedbackReportType;
  subject: string;
  description: string;
  imageUrl: string | null;
  status: FeedbackReportStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ListAdminReportsResult = {
  rows: AdminReportRow[];
  totalCount: number;
};

export type UpdateAdminReportStatusInput = {
  reportId: string;
  status: FeedbackReportStatus;
};

export type UpdateAdminReportStatusResult = {
  id: string;
  status: FeedbackReportStatus;
};

function buildSubmittedAtOrder(direction: "asc" | "desc") {
  return direction === "asc"
    ? [asc(feedback.createdAt), asc(feedback.id)]
    : [desc(feedback.createdAt), desc(feedback.id)];
}

function buildReportSubmittedAtOrder(direction: "asc" | "desc") {
  return direction === "asc"
    ? [asc(feedbackReport.createdAt), asc(feedbackReport.id)]
    : [desc(feedbackReport.createdAt), desc(feedbackReport.id)];
}

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

export async function listAdminFeedback(
  database: Database,
  input: ListAdminFeedbackFilter,
): Promise<ListAdminFeedbackResult> {
  const { limit, offset, sortDirection } = input;
  const orderBy = buildSubmittedAtOrder(sortDirection);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: feedback.id,
        userId: feedback.userId,
        name: user.name,
        email: feedback.email,
        message: feedback.message,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
      })
      .from(feedback)
      .leftJoin(user, eq(user.id, feedback.userId))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    database.select({ value: count() }).from(feedback),
  ]);

  return {
    rows,
    totalCount: totalRow[0]?.value ?? 0,
  };
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

export async function listAdminReports(
  database: Database,
  input: ListAdminReportsFilter,
): Promise<ListAdminReportsResult> {
  const { limit, offset, sortDirection, statuses, types } = input;
  const filters: SQL[] = [];

  if (statuses && statuses.length > 0) {
    filters.push(inArray(feedbackReport.status, statuses));
  }

  if (types && types.length > 0) {
    filters.push(inArray(feedbackReport.type, types));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const orderBy = buildReportSubmittedAtOrder(sortDirection);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: feedbackReport.id,
        userId: feedbackReport.userId,
        name: user.name,
        email: feedbackReport.email,
        type: feedbackReport.type,
        subject: feedbackReport.subject,
        description: feedbackReport.description,
        imageUrl: feedbackReport.imageUrl,
        status: feedbackReport.status,
        createdAt: feedbackReport.createdAt,
        updatedAt: feedbackReport.updatedAt,
      })
      .from(feedbackReport)
      .leftJoin(user, eq(user.id, feedbackReport.userId))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    database.select({ value: count() }).from(feedbackReport).where(where),
  ]);

  return {
    rows,
    totalCount: totalRow[0]?.value ?? 0,
  };
}

export async function updateAdminReportStatus(
  database: Database,
  input: UpdateAdminReportStatusInput,
): Promise<UpdateAdminReportStatusResult | null> {
  const [row] = await database
    .update(feedbackReport)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(feedbackReport.id, input.reportId))
    .returning({
      id: feedbackReport.id,
      status: feedbackReport.status,
    });

  return row ?? null;
}
