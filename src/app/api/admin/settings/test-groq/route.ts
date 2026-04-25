import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { callGroq } from "@/lib/ai/groq";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const apiKey = process.env.GROQ_API_KEY ?? db.select().from(appSettings).where(eq(appSettings.key, "groq.api_key")).get()?.value ?? "";
  const model = db.select().from(appSettings).where(eq(appSettings.key, "groq.model")).get()?.value ?? "llama-3.3-70b-versatile";

  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 400 });

  try {
    await callGroq({ apiKey, model, systemPrompt: "You are a test.", userMessage: "Reply with one word: OK", });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
