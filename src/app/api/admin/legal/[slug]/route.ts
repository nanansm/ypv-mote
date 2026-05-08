export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { legalPages, legalPageTranslations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { slug } = await params;
  const page = db.select().from(legalPages).where(eq(legalPages.slug, slug)).get();
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const translations = db.select().from(legalPageTranslations).where(eq(legalPageTranslations.pageId, page.id)).all();
  return NextResponse.json({ ...page, translations });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { slug } = await params;
  const body = (await req.json()) as { locale: string; title: string; bodyMarkdown: string };
  const page = db.select().from(legalPages).where(eq(legalPages.slug, slug)).get();
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const existing = db.select().from(legalPageTranslations).where(eq(legalPageTranslations.pageId, page.id)).all()
    .find((t) => t.locale === body.locale);

  if (existing) {
    db.update(legalPageTranslations).set({ title: body.title, bodyMarkdown: body.bodyMarkdown })
      .where(eq(legalPageTranslations.id, existing.id)).run();
  } else {
    db.insert(legalPageTranslations).values({ pageId: page.id, locale: body.locale, title: body.title, bodyMarkdown: body.bodyMarkdown }).run();
  }
  db.update(legalPages).set({ updatedAt: now }).where(eq(legalPages.id, page.id)).run();
  return NextResponse.json({ ok: true });
}
