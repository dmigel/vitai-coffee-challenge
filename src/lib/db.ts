import "server-only";
import { Pool } from "pg";

const globalForPg = globalThis as unknown as { __kvartaPgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    // Supabase pooler / serverless: avoid TLS certificate verification failures
    ssl: { rejectUnauthorized: false },
  });
}

/** Один пул на модуль (serverless-friendly). */
export const pool: Pool = globalForPg.__kvartaPgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.__kvartaPgPool = pool;
}
