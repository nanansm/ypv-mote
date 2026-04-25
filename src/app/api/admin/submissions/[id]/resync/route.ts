import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { syncSubmissionToSheet } from "@/lib/sheets/sync";
import { logSync } from "@/lib/logging";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const submission = db.select().from(submissions).where(eq(submissions.id, id)).get();
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await syncSubmissionToSheet(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logSync({ submissionId: id, service: "google_sheets", action: "resync", status: "failed", errorMessage: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
