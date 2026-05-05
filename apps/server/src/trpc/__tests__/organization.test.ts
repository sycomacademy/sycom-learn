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

describe("organization.updateBranding", () => {
  it("throws BAD_REQUEST when there is no active organization", async () => {
    const caller = makeCaller({ user: testUser() });
    await expect(
      caller.organization.updateBranding({ accentHex: "#4f46e5" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("organization.deleteActiveOrganization", () => {
  it("throws BAD_REQUEST when there is no active organization", async () => {
    const caller = makeCaller({ user: testUser() });
    await expect(caller.organization.deleteActiveOrganization()).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
