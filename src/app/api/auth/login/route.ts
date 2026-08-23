export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    // Enforced here rather than in a proxy: Next 16 runs Proxy on the Node.js
    // runtime, which OpenNext cannot deploy to Workers.
    if (!(await checkRateLimit(clientIp(req)))) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { email: string; password: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await db.select().from(adminUsers).where(eq(adminUsers.email, body.email)).get();
    if (!user || !user.passwordHash) {
      await bcrypt.compare("dummy", "$2b$12$dummy.hash.to.prevent.timing.attack.ok");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Reset rate limit on success
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "unknown";
    await resetRateLimit(ip);

    await createSession(user.id);

    return NextResponse.json({
      ok: true,
      mustChangePassword: user.mustChangePassword === 1,
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
