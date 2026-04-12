import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig, loadEnv } from "vite";

// Load Hono / DB env so SSR can resolve `@sycom/auth` (same vars as apps/server/.env)
config({ path: path.resolve(import.meta.dirname, "../server/.env") });

export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, import.meta.dirname, "");
  const apiTarget =
    localEnv.VITE_SERVER_URL && /^https?:\/\//.test(localEnv.VITE_SERVER_URL)
      ? new URL(localEnv.VITE_SERVER_URL).origin
      : "http://localhost:3000";

  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tailwindcss(), tanstackStart(), react()],
    server: {
      port: 3001,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/trpc": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
