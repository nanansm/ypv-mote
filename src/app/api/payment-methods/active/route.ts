export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import {
  getActiveNonIndonesiaMethods,
  getDefaultIndonesiaMethod,
} from "@/lib/payment-methods";

export async function GET() {
  return NextResponse.json({
    indonesiaDefault: getDefaultIndonesiaMethod(),
    others: getActiveNonIndonesiaMethods(),
  });
}
