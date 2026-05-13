export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import {
  deletePaymentMethod,
  getPaymentMethod,
  updatePaymentMethod,
} from "@/lib/payment-methods";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const method = getPaymentMethod(id);
  if (!method) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ method });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const body = (await req.json()) as {
    displayName?: unknown;
    currencyLabel?: unknown;
    fields?: unknown;
    isActive?: unknown;
    isDefaultForIndonesia?: unknown;
    orderIndex?: unknown;
  };

  let fields: Record<string, string> | undefined;
  if (body.fields && typeof body.fields === "object") {
    fields = {};
    for (const [k, v] of Object.entries(body.fields as Record<string, unknown>)) {
      fields[k] = v == null ? "" : String(v);
    }
  }

  const updated = updatePaymentMethod(id, {
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
    currencyLabel: typeof body.currencyLabel === "string" ? body.currencyLabel : undefined,
    fields,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    isDefaultForIndonesia:
      typeof body.isDefaultForIndonesia === "boolean"
        ? body.isDefaultForIndonesia
        : undefined,
    orderIndex: typeof body.orderIndex === "number" ? body.orderIndex : undefined,
  });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ method: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const result = deletePaymentMethod(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
