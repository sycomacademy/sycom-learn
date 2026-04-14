import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { getTestDatabase, cleanDatabase, isTestDatabaseAvailable } from "../../test-utils";
import { todo } from "../../schema/todo";
import { getAllTodos, createTodo, toggleTodo, deleteTodo } from "../../queries/todo";

const skip = !isTestDatabaseAvailable();

describe.skipIf(skip)("queries/todo", () => {
  let db: ReturnType<typeof getTestDatabase>;

  beforeEach(async () => {
    db = getTestDatabase();
    await cleanDatabase(db);
  });

  test("getAllTodos returns empty array when no todos exist", async () => {
    const result = await getAllTodos(db);
    expect(result).toEqual([]);
  });

  test("createTodo inserts a new todo", async () => {
    await createTodo({ text: "Write tests" }, db);

    const rows = await db.select().from(todo);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.text).toBe("Write tests");
    expect(rows[0]!.completed).toBe(false);
  });

  test("getAllTodos returns all inserted todos", async () => {
    await createTodo({ text: "First" }, db);
    await createTodo({ text: "Second" }, db);

    const result = await getAllTodos(db);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.text).sort()).toEqual(["First", "Second"]);
  });

  test("toggleTodo flips completed status", async () => {
    await createTodo({ text: "Toggle me" }, db);
    const [inserted] = await db.select().from(todo);

    await toggleTodo({ id: inserted!.id, completed: true }, db);

    const [updated] = await db.select().from(todo).where(eq(todo.id, inserted!.id));
    expect(updated!.completed).toBe(true);
  });

  test("toggleTodo can set back to incomplete", async () => {
    await createTodo({ text: "Toggle me" }, db);
    const [inserted] = await db.select().from(todo);

    await toggleTodo({ id: inserted!.id, completed: true }, db);
    await toggleTodo({ id: inserted!.id, completed: false }, db);

    const [updated] = await db.select().from(todo).where(eq(todo.id, inserted!.id));
    expect(updated!.completed).toBe(false);
  });

  test("deleteTodo removes the todo", async () => {
    await createTodo({ text: "Delete me" }, db);
    const [inserted] = await db.select().from(todo);

    await deleteTodo(inserted!.id, db);

    const remaining = await getAllTodos(db);
    expect(remaining).toHaveLength(0);
  });

  test("deleteTodo only removes the targeted todo", async () => {
    await createTodo({ text: "Keep" }, db);
    await createTodo({ text: "Delete" }, db);

    const all = await db.select().from(todo);
    const toDelete = all.find((t) => t.text === "Delete")!;

    await deleteTodo(toDelete.id, db);

    const remaining = await getAllTodos(db);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.text).toBe("Keep");
  });
});
