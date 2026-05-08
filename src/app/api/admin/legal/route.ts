export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { legalPages, legalPageTranslations } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const pages = db.select().from(legalPages).all();
  const result = pages.map((p) => ({
    ...p,
    translations: db.select().from(legalPageTranslations).all().filter((t) => t.pageId === p.id),
  }));
  return NextResponse.json(result);
}
