import { cookies } from "next/headers";
import { db } from "@/db";
import { adminUsers, adminSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const SESSION_COOKIE = "ypv_admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  mustChangePassword: boolean;
};

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.id, sessionId))
    .get();

  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    db.delete(adminSessions).where(eq(adminSessions.id, sessionId)).run();
    return null;
  }

  const user = db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .get();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword === 1,
  };
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.insert(adminSessions)
    .values({ id: sessionId, userId, expiresAt, createdAt: new Date().toISOString() })
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });

  return sessionId;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    db.delete(adminSessions).where(eq(adminSessions.id, sessionId)).run();
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function getSessionFromHeader(sessionId: string | undefined): AdminUser | null {
  if (!sessionId) return null;

  const session = db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.id, sessionId))
    .get();

  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    db.delete(adminSessions).where(eq(adminSessions.id, sessionId)).run();
    return null;
  }

  const user = db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .get();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword === 1,
  };
}
