import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { expirePendingBookings } from "@/lib/sessions";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const expired = await expirePendingBookings();
  return NextResponse.json({ expired });
}
