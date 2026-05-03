import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { expirePendingBookings } from "@/lib/sessions";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const expired = expirePendingBookings();
  return NextResponse.json({ expired });
}
