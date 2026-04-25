import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getSessionFromHeader } from "./index";
import type { AdminUser } from "./index";

export function requireAdmin(req: NextRequest): AdminUser | NextResponse {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const user = getSessionFromHeader(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}
