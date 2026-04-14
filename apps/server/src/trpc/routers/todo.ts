import {
  createTodo,
  deleteTodo,
  getAllTodos,
  toggleTodo,
} from "@sycom/db/queries/todo";
import z from "zod";

import { publicProcedure, router } from "../init";

export const todoRouter = router({
  getAll: publicProcedure.query(() => getAllTodos()),

  create: publicProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(({ input }) => createTodo(input)),

  toggle: publicProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .mutation(({ input }) => toggleTodo(input)),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTodo(input.id)),
});
