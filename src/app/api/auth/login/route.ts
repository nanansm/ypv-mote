export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { resetRateLimit } from "@/proxy";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email: string; password: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = db.select().from(adminUsers).where(eq(adminUsers.email, body.email)).get();
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
    resetRateLimit(ip);

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
