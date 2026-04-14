import "./setup-mocks";
import { beforeEach, describe, expect, test } from "bun:test";

import { callerFactory } from "../../trpc/init";
import { appRouter } from "../../trpc/routers/_app";
import { createTestContext } from "../helpers/test-context";
import { queryMocks } from "../helpers/mocks";

const createCaller = callerFactory(appRouter);

describe("tRPC: todo.getAll", () => {
  beforeEach(() => {
    queryMocks.getAllTodos.mockReset();
  });

  test("returns todos list", async () => {
    queryMocks.getAllTodos.mockImplementation(() =>
      Promise.resolve([
        { id: 1, text: "Write tests", completed: false },
        { id: 2, text: "Ship it", completed: true },
      ]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.todo.getAll();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, text: "Write tests" });
  });

  test("returns empty array when no todos", async () => {
    queryMocks.getAllTodos.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    const result = await caller.todo.getAll();

    expect(result).toEqual([]);
  });
});

describe("tRPC: todo.create", () => {
  beforeEach(() => {
    queryMocks.createTodo.mockReset();
  });

  test("calls createTodo with input text", async () => {
    queryMocks.createTodo.mockImplementation(() => Promise.resolve({}));

    const caller = createCaller(createTestContext());
    await caller.todo.create({ text: "New todo" });

    expect(queryMocks.createTodo).toHaveBeenCalledWith({ text: "New todo" });
  });

  test("rejects empty text", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.todo.create({ text: "" })).rejects.toThrow();
  });
});

describe("tRPC: todo.toggle", () => {
  beforeEach(() => {
    queryMocks.toggleTodo.mockReset();
  });

  test("calls toggleTodo with id and completed", async () => {
    queryMocks.toggleTodo.mockImplementation(() => Promise.resolve({}));

    const caller = createCaller(createTestContext());
    await caller.todo.toggle({ id: 1, completed: true });

    expect(queryMocks.toggleTodo).toHaveBeenCalledWith({
      id: 1,
      completed: true,
    });
  });
});

describe("tRPC: todo.delete", () => {
  beforeEach(() => {
    queryMocks.deleteTodo.mockReset();
  });

  test("calls deleteTodo with id", async () => {
    queryMocks.deleteTodo.mockImplementation(() => Promise.resolve({}));

    const caller = createCaller(createTestContext());
    await caller.todo.delete({ id: 42 });

    expect(queryMocks.deleteTodo).toHaveBeenCalledWith(42);
  });
});
