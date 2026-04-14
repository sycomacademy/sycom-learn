import { describe, expect, test } from "bun:test";

import { getTestDatabase, isTestDatabaseAvailable } from "../../test-utils";
import { checkHealth } from "../../queries/health";

const skip = !isTestDatabaseAvailable();

describe.skipIf(skip)("queries/health", () => {
  test("checkHealth returns true when DB is reachable", async () => {
    const db = getTestDatabase();
    const result = await checkHealth(db);
    expect(result).toBe(true);
  });
});
