import type { KVNamespace } from "@cloudflare/workers-types";

// Admin-login rate limiter. KV-backed on Cloudflare Workers (per-isolate
// memory would evaporate constantly there and effectively enforce nothing);
// falls back to an in-memory Map when the RATE_LIMIT binding doesn't exist
// (local `next dev`, unit tests, Playwright).
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 10;
const KV_KEY_PREFIX = "login-attempts:";
const MIN_KV_TTL_SECONDS = 60; // Cloudflare KV's floor for expirationTtl

interface Entry {
  count: number;
  firstAttempt: number;
}

/**
 * Returns the RATE_LIMIT KV binding when running on Cloudflare, or null
 * everywhere else. Mirrors the guarded-require pattern in src/db/index.ts so
 * this file never pulls @opennextjs/cloudflare (or the DB layer) into the
 * middleware bundle.
 */
function getRateLimitKV(): KVNamespace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const env = getCloudflareContext()?.env as { RATE_LIMIT?: KVNamespace } | undefined;
    return env?.RATE_LIMIT ?? null;
  } catch {
    return null;
  }
}

// In-memory fallback.
const memoryAttempts = new Map<string, Entry>();

function checkMemory(ip: string): boolean {
  const now = Date.now();
  const entry = memoryAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    memoryAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function resetMemory(ip: string): void {
  memoryAttempts.delete(ip);
}

/**
 * KV is eventually consistent: a read on one colo can lag a write made on
 * another by a few seconds, so a determined attacker hitting different edge
 * locations can slip a handful of extra attempts through before the count
 * converges globally. That's an accepted tradeoff (no Durable Object here) —
 * still far better than the old per-isolate Map, which reset on every cold
 * start on Workers and enforced nothing in practice.
 */
async function checkKV(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = KV_KEY_PREFIX + ip;
  const now = Date.now();
  const raw = await kv.get(key);
  const entry: Entry | null = raw ? (JSON.parse(raw) as Entry) : null;

  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    const fresh: Entry = { count: 1, firstAttempt: now };
    await kv.put(key, JSON.stringify(fresh), {
      expirationTtl: RATE_LIMIT_WINDOW_MS / 1000,
    });
    return true;
  }

  const updated: Entry = { count: entry.count + 1, firstAttempt: entry.firstAttempt };
  const remainingMs = RATE_LIMIT_WINDOW_MS - (now - entry.firstAttempt);
  const ttlSeconds = Math.max(MIN_KV_TTL_SECONDS, Math.ceil(remainingMs / 1000));
  await kv.put(key, JSON.stringify(updated), { expirationTtl: ttlSeconds });
  return updated.count <= RATE_LIMIT_MAX;
}

async function resetKV(kv: KVNamespace, ip: string): Promise<void> {
  await kv.delete(KV_KEY_PREFIX + ip);
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  // Opt-in escape hatch for the e2e suite: one Playwright project would burn
  // the whole 10-attempt budget and the next project's admin specs would all
  // skip on a 429. Never set this outside tests.
  if (process.env.DISABLE_LOGIN_RATE_LIMIT === "1") return true;

  const kv = getRateLimitKV();
  return kv ? checkKV(kv, ip) : checkMemory(ip);
}

export async function resetRateLimit(ip: string): Promise<void> {
  const kv = getRateLimitKV();
  if (kv) {
    await resetKV(kv, ip);
  } else {
    resetMemory(ip);
  }
}
