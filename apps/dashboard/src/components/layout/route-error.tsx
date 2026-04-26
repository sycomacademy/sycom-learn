import type { ErrorComponentProps } from "@tanstack/react-router";

import Error from "./error";
import GlobalError from "./global-error";

function isApiUnreachable(err: unknown): boolean {
  if (!(err instanceof globalThis.Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("failed to fetch") || msg.includes("fetch failed");
}

export default function RouteError({
  error,
  mode = "container",
}: ErrorComponentProps & { mode?: "container" | "screen" }) {
  return isApiUnreachable(error) ? <GlobalError /> : <Error mode={mode} />;
}
