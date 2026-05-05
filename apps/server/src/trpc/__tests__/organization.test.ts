import { describe, expect, it } from "bun:test";

import { makeCaller, testUser } from "./helpers";

describe("organization.workspaceContext", () => {
  it("throws BAD_REQUEST when there is no active organization", async () => {
    const caller = makeCaller({ user: testUser() });
    await expect(caller.organization.workspaceContext()).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
