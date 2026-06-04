import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

import { poolSsl } from "./src/pool-config";

dotenv.config({
  path: "../../apps/server/.env",
});

const databaseUrl = process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: poolSsl(databaseUrl),
  },
});
