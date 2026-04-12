import { auth } from "@sycom/auth";
import { db } from "@sycom/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const _headers = context.req.raw.headers;
  const session = await auth.api.getSession({
    headers: _headers,
  });
  return {
    headers: _headers,
    session,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
