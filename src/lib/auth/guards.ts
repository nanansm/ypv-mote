import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getSessionFromHeader } from "./index";
import type { AdminUser } from "./index";

export async function requireAdmin(req: NextRequest): Promise<AdminUser | NextResponse> {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await getSessionFromHeader(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}
