import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { submissions, aiAnalyses, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { analyzeSubmission } from "@/lib/ai/analyze";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const submission = db.select().from(submissions).where(eq(submissions.id, id)).get();
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKeySetting = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "groq.api_key"))
    .get();
  const modelSetting = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "groq.model"))
    .get();

  const apiKey = process.env.GROQ_API_KEY ?? apiKeySetting?.value ?? "";
  const model = modelSetting?.value ?? "llama-3.3-70b-versatile";

  if (!apiKey) {
    return NextResponse.json({ error: "Groq API key not configured" }, { status: 400 });
  }

  try {
    const result = await analyzeSubmission({ apiKey, model, submission });

    const now = new Date().toISOString();
    const inserted = db
      .insert(aiAnalyses)
      .values({
        submissionId: id,
        model,
        prompt: `system+user`,
        response: result.content,
        summary: result.content.slice(0, 200),
        createdAt: now,
        createdBy: (auth as { id: string }).id,
      })
      .returning()
      .get();

    return NextResponse.json({ analysis: inserted, tokens: { prompt: result.promptTokens, completion: result.completionTokens } });
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const analyses = db
    .select()
    .from(aiAnalyses)
    .where(eq(aiAnalyses.submissionId, id))
    .all()
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  return NextResponse.json(analyses);
}
