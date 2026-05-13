export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { reorderPaymentMethods, listPaymentMethods } from "@/lib/payment-methods";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as Array<{ id: unknown; orderIndex: unknown }>;
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an array" }, { status: 400 });
  }
  const order = body
    .filter(
      (i): i is { id: string; orderIndex: number } =>
        typeof i.id === "string" && typeof i.orderIndex === "number"
    )
    .map((i) => ({ id: i.id, orderIndex: i.orderIndex }));

  reorderPaymentMethods(order);
  return NextResponse.json({ methods: listPaymentMethods() });
}
