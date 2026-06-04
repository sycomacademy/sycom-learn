import type { PoolConfig } from "pg";

/** SSL settings shared by the app pool and drizzle-kit migrations. */
export function poolSsl(connectionString: string): PoolConfig["ssl"] {
  if (connectionString.includes("sslmode=disable")) {
    return false;
  }
  return { rejectUnauthorized: false };
}

export function poolOptions(connectionString: string): PoolConfig {
  return {
    connectionString,
    ssl: poolSsl(connectionString),
  };
}
