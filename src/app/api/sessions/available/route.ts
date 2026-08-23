import { NextResponse } from "next/server";
import { listAvailableSessions } from "@/lib/sessions";

export async function GET() {
  const sessions = await listAvailableSessions();
  return NextResponse.json({ sessions });
}
