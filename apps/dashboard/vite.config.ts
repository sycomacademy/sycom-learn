import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const shouldAnalyzeBundle = process.env.BUNDLE_ANALYZE === "true";
const isProductionBuild = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    shouldAnalyzeBundle &&
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        open: true,
      }),
    isProductionBuild && (nitro() as PluginOption),
  ],
  server: {
    port: 3000,
  },
});
