export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { legalPages, legalPageTranslations } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const pages = await db.select().from(legalPages).all();
  const result = await Promise.all(pages.map(async (p) => ({
    ...p,
    translations: (await db.select().from(legalPageTranslations).all()).filter((t) => t.pageId === p.id),
  })));
  return NextResponse.json(result);
}
