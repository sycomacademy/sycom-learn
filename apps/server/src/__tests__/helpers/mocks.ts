import { mock } from "bun:test";

// oxlint-disable-next-line typescript/no-explicit-any
export type MockFn = ReturnType<typeof mock<(...args: any[]) => any>>;

export const queryMocks = {
  getAllTodos: mock(() => Promise.resolve([])) as MockFn,
  createTodo: mock(() => Promise.resolve({})) as MockFn,
  toggleTodo: mock(() => Promise.resolve({})) as MockFn,
  deleteTodo: mock(() => Promise.resolve({})) as MockFn,

  checkHealth: mock(() => Promise.resolve(true)) as MockFn,

  getUserById: mock(() => Promise.resolve(null)) as MockFn,
  getUserByEmail: mock(() => Promise.resolve(null)) as MockFn,
  getSessionByToken: mock(() => Promise.resolve(null)) as MockFn,
  getOrganizationBySlug: mock(() => Promise.resolve(null)) as MockFn,
  getOrgMember: mock(() => Promise.resolve(null)) as MockFn,
  listOrgMembers: mock(() => Promise.resolve([])) as MockFn,
};

mock.module("@sycom/db/queries/todo", () => ({
  getAllTodos: queryMocks.getAllTodos,
  createTodo: queryMocks.createTodo,
  toggleTodo: queryMocks.toggleTodo,
  deleteTodo: queryMocks.deleteTodo,
}));

mock.module("@sycom/db/queries/health", () => ({
  checkHealth: queryMocks.checkHealth,
}));

mock.module("@sycom/db/queries/auth", () => ({
  getUserById: queryMocks.getUserById,
  getUserByEmail: queryMocks.getUserByEmail,
  getSessionByToken: queryMocks.getSessionByToken,
  getOrganizationBySlug: queryMocks.getOrganizationBySlug,
  getOrgMember: queryMocks.getOrgMember,
  listOrgMembers: queryMocks.listOrgMembers,
}));
