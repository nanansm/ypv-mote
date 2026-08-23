import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./dev.db";

// libsql accepts a `file:` URL directly. Callers that still pass a bare path
// (or the older `file:./dev.db` form) both resolve correctly here.
const url = DATABASE_URL.startsWith("file:") ? DATABASE_URL : `file:${DATABASE_URL}`;

export const client = createClient({ url });

// Fire-and-forget: libsql queues these ahead of any query issued later, so the
// pragmas are in effect before the first real statement runs.
void client.execute("PRAGMA journal_mode = WAL");
void client.execute("PRAGMA foreign_keys = ON");

export const db = drizzle(client, { schema });
export type DB = typeof db;
