import "./setup-mocks";
import { beforeEach, describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import { callerFactory } from "../../trpc/init";
import { appRouter } from "../../trpc/routers/_app";
import { createTestContext, createUnauthenticatedContext } from "../helpers/test-context";
import { queryMocks } from "../helpers/mocks";

const createCaller = callerFactory(appRouter);

describe("tRPC: healthCheck", () => {
  beforeEach(() => {
    queryMocks.checkHealth.mockReset();
    queryMocks.checkHealth.mockImplementation(() => Promise.resolve(true));
  });

  test("returns true when DB is healthy", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.healthCheck();

    expect(result).toBe(true);
  });
});

describe("tRPC: privateData", () => {
  test("returns user data for authenticated caller", async () => {
    const caller = createCaller(createTestContext({ userName: "Asa" }));
    const result = await caller.privateData();

    expect(result.message).toBe("This is private");
    expect(result.user.name).toBe("Asa");
  });

  test("throws UNAUTHORIZED for unauthenticated caller", async () => {
    const caller = createCaller(createUnauthenticatedContext());

    try {
      await caller.privateData();
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe("UNAUTHORIZED");
    }
  });
});
