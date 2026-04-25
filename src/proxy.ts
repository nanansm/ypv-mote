import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_COOKIE = "ypv_admin_session";

// Simple in-memory rate limiter for login endpoint
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 10;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // API admin routes: check session cookie, return 401 if missing
  if (pathname.startsWith("/api/admin")) {
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Rate limit login API
  if (pathname === "/api/auth/login" && req.method === "POST") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }
    return NextResponse.next();
  }

  // Admin UI routes: redirect to login if no session
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login")
  ) {
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Public routes: use next-intl middleware
  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api")
  ) {
    return intlMiddleware(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
