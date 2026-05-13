export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import {
  countPendingReviews,
  listReviews,
  type ReviewStatus,
} from "@/lib/reviews";

function asStatus(value: string | null): ReviewStatus | null {
  if (value === "pending" || value === "approved" || value === "hidden") return value;
  return null;
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const status = asStatus(sp.get("status"));
  const ratingParam = sp.get("rating");
  const rating = ratingParam ? Number(ratingParam) : null;
  const locale = sp.get("locale");

  const reviews = listReviews({
    status,
    rating: Number.isFinite(rating) && rating !== null && rating >= 1 && rating <= 5 ? rating : null,
    locale: locale === "en" || locale === "de" ? locale : null,
  });

  return NextResponse.json({
    reviews,
    pendingCount: countPendingReviews(),
  });
}
