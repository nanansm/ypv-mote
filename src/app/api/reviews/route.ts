export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createReview } from "@/lib/reviews";

function getIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: unknown;
    email?: unknown;
    rating?: unknown;
    comment?: unknown;
    locale?: unknown;
  };

  const ip = getIp(req);
  const result = createReview(
    {
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : "",
      rating:
        typeof body.rating === "number"
          ? body.rating
          : typeof body.rating === "string"
            ? Number(body.rating)
            : 0,
      comment: typeof body.comment === "string" ? body.comment : "",
      locale: typeof body.locale === "string" ? body.locale : undefined,
    },
    ip
  );

  if (!result.ok) {
    const status =
      result.code === "duplicate" ? 409 : result.code === "rate_limit" ? 429 : 400;
    return NextResponse.json({ error: result.message, code: result.code }, { status });
  }
  return NextResponse.json({ ok: true, review: result.review }, { status: 201 });
}
