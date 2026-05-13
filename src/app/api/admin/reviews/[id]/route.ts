export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteReview, updateReviewStatus } from "@/lib/reviews";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: unknown };
  if (
    body.status !== "approved" &&
    body.status !== "hidden" &&
    body.status !== "pending"
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const updated = updateReviewStatus(id, body.status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ review: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const ok = deleteReview(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ error: "Use PATCH or DELETE" }, { status: 405 });
}
