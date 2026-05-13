export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import {
  createPaymentMethod,
  listPaymentMethods,
} from "@/lib/payment-methods";
import { isPreset } from "@/lib/payment-methods/presets";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ methods: listPaymentMethods() });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    preset?: unknown;
    displayName?: unknown;
    currencyLabel?: unknown;
    fields?: unknown;
    isActive?: unknown;
    isDefaultForIndonesia?: unknown;
    key?: unknown;
  };

  if (!isPreset(body.preset)) {
    return NextResponse.json(
      { error: "Invalid or missing preset" },
      { status: 400 }
    );
  }

  const fields: Record<string, string> = {};
  if (body.fields && typeof body.fields === "object") {
    for (const [k, v] of Object.entries(body.fields as Record<string, unknown>)) {
      fields[k] = v == null ? "" : String(v);
    }
  }

  const created = createPaymentMethod({
    preset: body.preset,
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
    currencyLabel: typeof body.currencyLabel === "string" ? body.currencyLabel : undefined,
    fields,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    isDefaultForIndonesia:
      typeof body.isDefaultForIndonesia === "boolean"
        ? body.isDefaultForIndonesia
        : undefined,
    key: typeof body.key === "string" ? body.key : undefined,
  });

  return NextResponse.json({ method: created }, { status: 201 });
}
