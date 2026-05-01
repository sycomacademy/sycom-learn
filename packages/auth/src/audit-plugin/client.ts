import type { BetterAuthClientPlugin } from "better-auth/client";
import type { auditPlugin } from "./server";

export const auditPluginClient = () => {
  return {
    id: "auditPlugin",
    $InferServerPlugin: {} as ReturnType<typeof auditPlugin>,
  } satisfies BetterAuthClientPlugin;
};
