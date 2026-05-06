/**
 * Hook for future background processing of org bulk invites (e.g. Trigger.dev).
 * Intentionally a no-op placeholder — the tRPC handler still processes rows inline.
 */
export async function placeholderScheduleOrgBulkMemberInvites(_input: {
  organizationId: string;
  rowCount: number;
}): Promise<void> {
  await Promise.resolve();
}
