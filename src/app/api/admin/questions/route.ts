export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { formQuestions, questionOptions, questionTranslations } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const questions = (await db.select().from(formQuestions).all()).sort((a, b) => {
    if (a.section !== b.section) return a.section - b.section;
    return a.order - b.order;
  });

  const result = await Promise.all(questions.map(async (q) => {
    const translations = (await db.select().from(questionTranslations).all())
      .filter((t) => t.questionId === q.id);
    const optsRaw = (await db.select().from(questionOptions).all())
      .filter((o) => o.questionId === q.id)
      .sort((a, b) => a.order - b.order);
    const opts = await Promise.all(optsRaw.map(async (opt) => ({
      ...opt,
      translations: (await db.select().from(questionTranslations).all())
        .filter((t) => t.optionId === opt.id),
    })));
    return { ...q, translations, options: opts };
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    key: string;
    type: string;
    section: number;
    order: number;
    required: number;
    isEligibilityGate: number;
    validationRule?: string;
  };

  const now = new Date().toISOString();
  const result = await db.insert(formQuestions).values({ ...body, createdAt: now, updatedAt: now }).returning().get();
  return NextResponse.json(result);
}
