export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(db.select().from(emailTemplates).all());
}
