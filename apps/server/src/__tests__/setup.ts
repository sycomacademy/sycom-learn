import { mock } from "bun:test";

process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://fake:fake@localhost:5432/fake_test";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || "test-secret-that-is-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3001";
process.env.NODE_ENV = "test";

const noop = () => undefined;

const createMockLogger = () => ({
  info: mock(noop),
  error: mock(noop),
  warn: mock(noop),
  debug: mock(noop),
});

const mockLogger = createMockLogger();

mock.module("@sycom/logger", () => ({
  logger: mockLogger,
  default: mockLogger,
  createLoggerWithContext: () => createMockLogger(),
  setLogLevel: mock(noop),
}));

const createMockDb = () => ({
  select: mock(() => ({
    from: mock(() => Promise.resolve([])),
  })),
  insert: mock(() => ({
    values: mock(() => ({
      returning: mock(() => Promise.resolve([])),
    })),
  })),
  update: mock(() => ({
    set: mock(() => ({
      where: mock(() => ({
        returning: mock(() => Promise.resolve([])),
      })),
    })),
  })),
  delete: mock(() => ({
    where: mock(() => ({
      returning: mock(() => Promise.resolve([])),
    })),
  })),
  execute: mock(() => Promise.resolve()),
  query: {},
});

export const mockDb = createMockDb();

mock.module("@sycom/db", () => ({
  db: mockDb,
  createDb: () => mockDb,
  // oxlint-disable-next-line typescript/no-explicit-any
  Database: {} as any,
}));

mock.module("@sycom/auth", () => ({
  auth: {
    api: {
      getSession: mock(() => Promise.resolve(null)),
    },
    handler: mock(() => new Response("ok")),
  },
  createAuth: mock(() => ({})),
}));
