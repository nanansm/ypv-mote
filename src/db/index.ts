import type { D1Database } from "@cloudflare/workers-types";
import { createClient } from "@libsql/client";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Both drivers expose the same Drizzle query builder. Typing the handle as a
// union makes overload resolution collapse (db.select(fields) stops type-
// checking), so pin one driver's type and cast the other to it.
export type DB = ReturnType<typeof drizzleLibsql<typeof schema>>;

/**
 * Returns the D1 binding when running on Cloudflare, or null everywhere else
 * (local `next dev`, Playwright, unit tests, scripts). Importing
 * `@opennextjs/cloudflare` outside a Worker throws, hence the guarded require.
 */
export function getD1(): D1Database | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const env = getCloudflareContext()?.env as { DB?: D1Database } | undefined;
    return env?.DB ?? null;
  } catch {
    return null;
  }
}

export function isCloudflareRuntime(): boolean {
  return getD1() !== null;
}

// One Drizzle instance per D1 binding. The binding object is recreated per
// request, so caching on it keeps us from rebuilding the schema every query
// while still following the request that owns it.
const d1Cache = new WeakMap<D1Database, DB>();

function d1Db(binding: D1Database): DB {
  const cached = d1Cache.get(binding);
  if (cached) return cached;
  const instance = drizzleD1(binding, { schema }) as unknown as DB;
  d1Cache.set(binding, instance);
  return instance;
}

let localDb: DB | null = null;

function libsqlDb(): DB {
  if (localDb) return localDb;
  const DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";
  const url = DATABASE_URL.startsWith("file:") ? DATABASE_URL : `file:${DATABASE_URL}`;
  // Imported statically on purpose: a lazy require() makes Turbopack pull in
  // the package directory itself (README files included) and every route 500s.
  // On Workers this branch is unreachable — getD1() wins — so the module is
  // loaded there but never used.
  const client = createClient({ url });
  void client.execute("PRAGMA journal_mode = WAL");
  void client.execute("PRAGMA foreign_keys = ON");
  localDb = drizzleLibsql(client, { schema });
  return localDb;
}

function resolveDb(): DB {
  const binding = getD1();
  return binding ? d1Db(binding) : libsqlDb();
}

/**
 * Drizzle handle. A Proxy so the driver is chosen per call rather than at
 * import time: on Workers the D1 binding only exists inside a request, while
 * locally we keep a single libsql connection. Every call site stays `db.x()`.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const real = resolveDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
