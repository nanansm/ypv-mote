export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { formQuestions, questionOptions, questionTranslations } from "@/db/schema";
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const qId = parseInt(id);

  const q = await db.select().from(formQuestions).where(eq(formQuestions.id, qId)).get();
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const translations = await db.select().from(questionTranslations)
    .where(eq(questionTranslations.questionId, qId)).all();
  const optsRaw = (await db.select().from(questionOptions).where(eq(questionOptions.questionId, qId)).all())
    .sort((a, b) => a.order - b.order);
  const opts = await Promise.all(optsRaw.map(async (opt) => ({
    ...opt,
    translations: await db.select().from(questionTranslations)
      .where(eq(questionTranslations.optionId, opt.id)).all(),
  })));

  return NextResponse.json({ ...q, translations, options: opts });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const qId = parseInt(id);

  const body = (await req.json()) as {
    key?: string; type?: string; section?: number; order?: number;
    required?: number; isEligibilityGate?: number; validationRule?: string | null;
    translations?: Array<{ locale: string; label: string; placeholder?: string; helpText?: string }>;
    options?: Array<{
      id?: number; value: string; order: number;
      translations: Array<{ locale: string; label: string }>;
    }>;
  };

  const now = new Date().toISOString();
  const { translations, options, ...rest } = body;

  if (Object.keys(rest).length > 0) {
    await db.update(formQuestions).set({ ...rest, updatedAt: now }).where(eq(formQuestions.id, qId)).run();
  }

  if (translations) {
    for (const t of translations) {
      const existing = (await db.select().from(questionTranslations)
        .where(eq(questionTranslations.questionId, qId)).all())
        .find((r) => r.locale === t.locale);
      if (existing) {
        await db.update(questionTranslations).set({ label: t.label, placeholder: t.placeholder ?? null, helpText: t.helpText ?? null })
          .where(eq(questionTranslations.id, existing.id)).run();
      } else {
        await db.insert(questionTranslations).values({ questionId: qId, optionId: null, locale: t.locale, label: t.label, placeholder: t.placeholder ?? null, helpText: t.helpText ?? null }).run();
      }
    }
  }

  if (options !== undefined) {
    // Delete old options not in list
    const newIds = options.filter((o) => o.id).map((o) => o.id!);
    const existing = await db.select().from(questionOptions).where(eq(questionOptions.questionId, qId)).all();
    for (const old of existing) {
      if (!newIds.includes(old.id)) {
        await db.delete(questionTranslations).where(eq(questionTranslations.optionId, old.id)).run();
        await db.delete(questionOptions).where(eq(questionOptions.id, old.id)).run();
      }
    }
    for (const opt of options) {
      let optId = opt.id;
      if (optId) {
        await db.update(questionOptions).set({ value: opt.value, order: opt.order }).where(eq(questionOptions.id, optId)).run();
      } else {
        const inserted = await db.insert(questionOptions).values({ questionId: qId, value: opt.value, order: opt.order }).returning().get();
        optId = inserted.id;
      }
      for (const ot of opt.translations) {
        const existingOT = (await db.select().from(questionTranslations).where(eq(questionTranslations.optionId, optId!)).all()).find((r) => r.locale === ot.locale);
        if (existingOT) {
          await db.update(questionTranslations).set({ label: ot.label }).where(eq(questionTranslations.id, existingOT.id)).run();
        } else {
          await db.insert(questionTranslations).values({ questionId: null, optionId: optId!, locale: ot.locale, label: ot.label, placeholder: null, helpText: null }).run();
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const qId = parseInt(id);

  const opts = await db.select().from(questionOptions).where(eq(questionOptions.questionId, qId)).all();
  for (const opt of opts) {
    await db.delete(questionTranslations).where(eq(questionTranslations.optionId, opt.id)).run();
  }
  await db.delete(questionOptions).where(eq(questionOptions.questionId, qId)).run();
  await db.delete(questionTranslations).where(eq(questionTranslations.questionId, qId)).run();
  await db.delete(formQuestions).where(eq(formQuestions.id, qId)).run();

  return NextResponse.json({ ok: true });
}
