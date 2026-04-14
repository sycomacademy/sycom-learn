import { eq } from "drizzle-orm";

import { db, type Database } from "..";
import { todo, type NewTodo, type Todo } from "../schema/todo";

export async function getAllTodos(database: Database = db): Promise<Todo[]> {
  return database.select().from(todo);
}

export async function createTodo(input: Pick<NewTodo, "text">, database: Database = db) {
  return database.insert(todo).values({ text: input.text });
}

export async function toggleTodo(
  input: { id: number; completed: boolean },
  database: Database = db,
) {
  return database.update(todo).set({ completed: input.completed }).where(eq(todo.id, input.id));
}

export async function deleteTodo(id: number, database: Database = db) {
  return database.delete(todo).where(eq(todo.id, id));
}
