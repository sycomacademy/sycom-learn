import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.url(),
    VITE_WEBSITE_URL: z.url(),
    VITE_DASHBOARD_URL: z.url(),
    VITE_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  },
  // oxlint-disable-next-line typescript/no-explicit-any
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
