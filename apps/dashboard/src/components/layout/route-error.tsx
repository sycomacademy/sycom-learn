import type { ErrorComponentProps } from "@tanstack/react-router";

import Error from "./error";
import GlobalError from "./global-error";

function isApiUnreachable(err: unknown): boolean {
  if (!(err instanceof globalThis.Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("failed to fetch") || msg.includes("fetch failed");
}

export default function RouteError({ error }: ErrorComponentProps) {
  return (
    <div className="flex size-full min-h-screen items-center justify-center">
      {isApiUnreachable(error) ? <GlobalError /> : <Error />}
    </div>
  );
}
