// Atomic, cross-instance request quotas backed by existing Neon PostgreSQL.
// No raw IP addresses, Clerk identifiers, or database credentials are stored in the quota table.
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { neon } from "@neondatabase/serverless";

let schemaPromise = null;
let lastPruneDay = -1;

function dbClient() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw Error("Quota storage is unavailable");
  return neon(url);
}

export function trustedClientIp(headers) {
  // Vercel forwards the client address. Do not use an arbitrary comma-separated
  // list as a rate-limit key or accept invalid user-supplied identifiers.
  const names = ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"];
  for (const name of names) {
    const candidate = (headers.get(name) || "").split(",")[0].trim();
    if (isIP(candidate)) return candidate;
  }
  return "unknown";
}

export function hashQuotaIdentity(namespace, identity, secret) {
  if (!namespace || typeof identity !== "string" || !secret) throw Error("Invalid quota configuration");
  return createHmac("sha256", secret).update(namespace + "\0" + identity, "utf8").digest("hex");
}

async function ready(sql) {
  if (!schemaPromise) {
    schemaPromise = sql`
      CREATE TABLE IF NOT EXISTS ahq_request_quotas (
        bucket CHAR(64) NOT NULL,
        period BIGINT NOT NULL,
        hits INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (bucket,period)
      )
    `.catch(error => { schemaPromise = null; throw error; });
  }
  await schemaPromise;
}

export async function useRequestQuota({namespace, identity, limit, windowSeconds}) {
  if (typeof namespace !== "string" || !/^[a-z0-9-]{1,60}$/.test(namespace)) throw Error("Invalid quota namespace");
  if (typeof identity !== "string" || !identity || identity.length > 300) throw Error("Invalid quota identity");
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw Error("Invalid quota limit");
  if (!Number.isInteger(windowSeconds) || windowSeconds < 60 || windowSeconds > 86400) throw Error("Invalid quota window");
  // A dedicated AHQ_RATE_LIMIT_SECRET is preferred. As a backwards-compatible
  // safe default, use the already server-only database credential as an HMAC key.
  // Never expose or log it. All instances share the same effective secret.
  const privateKey = process.env.AHQ_RATE_LIMIT_SECRET || process.env.NEON_DATABASE_URL;
  if (!privateKey) throw Error("Quota signing key is not configured");
  const sql = dbClient();
  await ready(sql);
  const bucket = hashQuotaIdentity(namespace, identity, privateKey);
  const period = Math.floor(Date.now() / (windowSeconds * 1000));
  const expiration = new Date((period + 1) * windowSeconds * 1000).toISOString();
  const rows = await sql`
    INSERT INTO ahq_request_quotas(bucket,period,hits,expires_at)
    VALUES (${bucket},${period},1,${expiration}::timestamptz)
    ON CONFLICT (bucket,period) DO UPDATE SET hits=ahq_request_quotas.hits+1
    RETURNING hits
  `;
  // Occasionally prune obsolete window rows; no unbounded in-memory Map.
  const day = Math.floor(Date.now() / 86400000);
  if (lastPruneDay !== day) {
    lastPruneDay = day;
    try { await sql`DELETE FROM ahq_request_quotas WHERE expires_at < now() - interval '7 days'`; }
    catch { lastPruneDay = -1; } // Quota enforcement still worked even if cleanup failed.
  }
  const hits = Number(rows[0]?.hits || 0);
  return {
    allowed: hits <= limit,
    remaining: Math.max(0, limit - hits),
    retryAfter: Math.max(1, Math.ceil((period + 1) * windowSeconds - Date.now() / 1000)),
  };
}

export function quotaResponse(result) {
  return Response.json({error:"Too many requests. Please try again later.",code:"rate-limited"}, {
    status:429,
    headers:{"Retry-After":String(result.retryAfter),"Cache-Control":"no-store"},
  });
}
