export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const row = db.select().from(submissions).where(eq(submissions.id, id)).get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await req.json()) as {
    adminNotes?: string;
    paymentStatus?: string;
    paymentVerifiedAt?: string;
    paymentVerifiedBy?: string;
    deletedAt?: string | null;
  };

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updatedAt: now };

  if (body.adminNotes !== undefined) update.adminNotes = body.adminNotes;
  if (body.paymentStatus !== undefined) update.paymentStatus = body.paymentStatus;
  if (body.paymentVerifiedAt !== undefined) update.paymentVerifiedAt = body.paymentVerifiedAt;
  if (body.paymentVerifiedBy !== undefined) update.paymentVerifiedBy = body.paymentVerifiedBy;
  if (body.deletedAt !== undefined) update.deletedAt = body.deletedAt;

  db.update(submissions).set(update).where(eq(submissions.id, id)).run();
  return NextResponse.json({ ok: true });
}
