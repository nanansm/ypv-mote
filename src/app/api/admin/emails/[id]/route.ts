import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const row = db.select().from(emailTemplates).where(eq(emailTemplates.id, parseInt(id))).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await req.json()) as { subject?: string; bodyText?: string };
  const now = new Date().toISOString();
  db.update(emailTemplates).set({ ...body, updatedAt: now, updatedBy: (auth as { id: string }).id })
    .where(eq(emailTemplates.id, parseInt(id))).run();
  return NextResponse.json({ ok: true });
}
