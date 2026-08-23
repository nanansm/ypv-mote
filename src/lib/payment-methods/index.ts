import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { and, asc, eq, ne } from "drizzle-orm";
import {
  emptyFieldsFor,
  isPreset,
  parseFields,
  sanitizeFields,
  isMethodConfigured,
  PRESET_DEFAULTS,
  type AnyFields,
  type Preset,
} from "./presets";

export type PaymentMethodRow = {
  id: string;
  key: string;
  displayName: string;
  currencyLabel: string;
  preset: Preset;
  fields: AnyFields;
  isActive: boolean;
  isDefaultForIndonesia: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

function toRow(raw: typeof paymentMethods.$inferSelect): PaymentMethodRow {
  const preset: Preset = isPreset(raw.preset) ? raw.preset : "custom_bank";
  return {
    id: raw.id,
    key: raw.key,
    displayName: raw.displayName,
    currencyLabel: raw.currencyLabel,
    preset,
    fields: sanitizeFields(preset, parseFields(raw.fields)),
    isActive: raw.isActive === 1,
    isDefaultForIndonesia: raw.isDefaultForIndonesia === 1,
    orderIndex: raw.orderIndex,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function listPaymentMethods(): Promise<PaymentMethodRow[]> {
  const rows = await db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.orderIndex))
    .all();
  return rows.map(toRow);
}

export async function listActivePaymentMethods(): Promise<PaymentMethodRow[]> {
  return (await listPaymentMethods()).filter((m) => m.isActive);
}

export async function getPaymentMethod(id: string): Promise<PaymentMethodRow | null> {
  const row = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .get();
  return row ? toRow(row) : null;
}

export async function getPaymentMethodByKey(key: string): Promise<PaymentMethodRow | null> {
  const row = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.key, key))
    .get();
  return row ? toRow(row) : null;
}

export async function getDefaultIndonesiaMethod(): Promise<PaymentMethodRow | null> {
  const rows = (await listActivePaymentMethods()).filter((m) => m.isDefaultForIndonesia);
  return rows[0] ?? null;
}

export async function getActiveNonIndonesiaMethods(): Promise<PaymentMethodRow[]> {
  return (await listActivePaymentMethods()).filter((m) => !m.isDefaultForIndonesia);
}

async function nextOrderIndex(): Promise<number> {
  const rows = await listPaymentMethods();
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((m) => m.orderIndex)) + 1;
}

async function maybeUniqueKey(desired: string): Promise<string> {
  const base = desired.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "method";
  let candidate = base;
  let i = 2;
  while (await getPaymentMethodByKey(candidate)) {
    candidate = `${base}_${i++}`;
  }
  return candidate;
}

export type CreateInput = {
  preset: Preset;
  displayName?: string;
  currencyLabel?: string;
  fields?: AnyFields;
  isActive?: boolean;
  isDefaultForIndonesia?: boolean;
  key?: string;
};

export async function createPaymentMethod(input: CreateInput): Promise<PaymentMethodRow> {
  const defaults = PRESET_DEFAULTS[input.preset];
  const displayName = (input.displayName ?? defaults.displayName).trim() || defaults.displayName;
  const currencyLabel = (input.currencyLabel ?? defaults.currencyLabel).trim() || defaults.currencyLabel;
  const key = await maybeUniqueKey(input.key ?? displayName);
  const fields = sanitizeFields(input.preset, input.fields ?? emptyFieldsFor(input.preset));
  const now = new Date().toISOString();
  const id = randomUUID();

  await db.insert(paymentMethods)
    .values({
      id,
      key,
      displayName,
      currencyLabel,
      preset: input.preset,
      fields: JSON.stringify(fields),
      isActive: input.isActive === false ? 0 : 1,
      isDefaultForIndonesia: input.isDefaultForIndonesia ? 1 : 0,
      orderIndex: await nextOrderIndex(),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (input.isDefaultForIndonesia) {
    await clearOtherIndonesiaDefaults(id);
  }

  const created = await getPaymentMethod(id);
  if (!created) throw new Error("Failed to create payment method");
  return created;
}

export type UpdateInput = {
  displayName?: string;
  currencyLabel?: string;
  fields?: AnyFields;
  isActive?: boolean;
  isDefaultForIndonesia?: boolean;
  orderIndex?: number;
};

export async function updatePaymentMethod(id: string, input: UpdateInput): Promise<PaymentMethodRow | null> {
  const existing = await getPaymentMethod(id);
  if (!existing) return null;
  const now = new Date().toISOString();

  const patch: Partial<typeof paymentMethods.$inferInsert> = { updatedAt: now };
  if (input.displayName !== undefined) {
    patch.displayName = input.displayName.trim() || existing.displayName;
  }
  if (input.currencyLabel !== undefined) {
    patch.currencyLabel = input.currencyLabel.trim() || existing.currencyLabel;
  }
  if (input.fields !== undefined) {
    const sanitized = sanitizeFields(existing.preset, input.fields);
    patch.fields = JSON.stringify(sanitized);
  }
  if (input.isActive !== undefined) {
    patch.isActive = input.isActive ? 1 : 0;
  }
  if (input.isDefaultForIndonesia !== undefined) {
    patch.isDefaultForIndonesia = input.isDefaultForIndonesia ? 1 : 0;
  }
  if (input.orderIndex !== undefined) {
    patch.orderIndex = input.orderIndex;
  }

  await db.update(paymentMethods).set(patch).where(eq(paymentMethods.id, id)).run();

  if (input.isDefaultForIndonesia === true) {
    await clearOtherIndonesiaDefaults(id);
  }

  return getPaymentMethod(id);
}

async function clearOtherIndonesiaDefaults(keepId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.update(paymentMethods)
    .set({ isDefaultForIndonesia: 0, updatedAt: now })
    .where(
      and(
        ne(paymentMethods.id, keepId),
        eq(paymentMethods.isDefaultForIndonesia, 1)
      )
    )
    .run();
}

export async function deletePaymentMethod(id: string): Promise<{ ok: boolean; error?: string }> {
  const existing = await getPaymentMethod(id);
  if (!existing) return { ok: false, error: "Not found" };
  if (existing.isDefaultForIndonesia) {
    return {
      ok: false,
      error: "Set another method as Indonesia default first.",
    };
  }
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id)).run();
  return { ok: true };
}

export async function reorderPaymentMethods(order: { id: string; orderIndex: number }[]): Promise<void> {
  const now = new Date().toISOString();
  for (const item of order) {
    await db.update(paymentMethods)
      .set({ orderIndex: item.orderIndex, updatedAt: now })
      .where(eq(paymentMethods.id, item.id))
      .run();
  }
}

export function isConfigured(method: PaymentMethodRow): boolean {
  return isMethodConfigured(method.preset, method.fields);
}
