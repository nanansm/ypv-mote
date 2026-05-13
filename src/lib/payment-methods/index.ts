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

export function listPaymentMethods(): PaymentMethodRow[] {
  const rows = db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.orderIndex))
    .all();
  return rows.map(toRow);
}

export function listActivePaymentMethods(): PaymentMethodRow[] {
  return listPaymentMethods().filter((m) => m.isActive);
}

export function getPaymentMethod(id: string): PaymentMethodRow | null {
  const row = db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .get();
  return row ? toRow(row) : null;
}

export function getPaymentMethodByKey(key: string): PaymentMethodRow | null {
  const row = db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.key, key))
    .get();
  return row ? toRow(row) : null;
}

export function getDefaultIndonesiaMethod(): PaymentMethodRow | null {
  const rows = listActivePaymentMethods().filter((m) => m.isDefaultForIndonesia);
  return rows[0] ?? null;
}

export function getActiveNonIndonesiaMethods(): PaymentMethodRow[] {
  return listActivePaymentMethods().filter((m) => !m.isDefaultForIndonesia);
}

function nextOrderIndex(): number {
  const rows = listPaymentMethods();
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((m) => m.orderIndex)) + 1;
}

function maybeUniqueKey(desired: string): string {
  const base = desired.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "method";
  let candidate = base;
  let i = 2;
  while (getPaymentMethodByKey(candidate)) {
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

export function createPaymentMethod(input: CreateInput): PaymentMethodRow {
  const defaults = PRESET_DEFAULTS[input.preset];
  const displayName = (input.displayName ?? defaults.displayName).trim() || defaults.displayName;
  const currencyLabel = (input.currencyLabel ?? defaults.currencyLabel).trim() || defaults.currencyLabel;
  const key = maybeUniqueKey(input.key ?? displayName);
  const fields = sanitizeFields(input.preset, input.fields ?? emptyFieldsFor(input.preset));
  const now = new Date().toISOString();
  const id = randomUUID();

  db.insert(paymentMethods)
    .values({
      id,
      key,
      displayName,
      currencyLabel,
      preset: input.preset,
      fields: JSON.stringify(fields),
      isActive: input.isActive === false ? 0 : 1,
      isDefaultForIndonesia: input.isDefaultForIndonesia ? 1 : 0,
      orderIndex: nextOrderIndex(),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (input.isDefaultForIndonesia) {
    clearOtherIndonesiaDefaults(id);
  }

  const created = getPaymentMethod(id);
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

export function updatePaymentMethod(id: string, input: UpdateInput): PaymentMethodRow | null {
  const existing = getPaymentMethod(id);
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

  db.update(paymentMethods).set(patch).where(eq(paymentMethods.id, id)).run();

  if (input.isDefaultForIndonesia === true) {
    clearOtherIndonesiaDefaults(id);
  }

  return getPaymentMethod(id);
}

function clearOtherIndonesiaDefaults(keepId: string): void {
  const now = new Date().toISOString();
  db.update(paymentMethods)
    .set({ isDefaultForIndonesia: 0, updatedAt: now })
    .where(
      and(
        ne(paymentMethods.id, keepId),
        eq(paymentMethods.isDefaultForIndonesia, 1)
      )
    )
    .run();
}

export function deletePaymentMethod(id: string): { ok: boolean; error?: string } {
  const existing = getPaymentMethod(id);
  if (!existing) return { ok: false, error: "Not found" };
  if (existing.isDefaultForIndonesia) {
    return {
      ok: false,
      error: "Set another method as Indonesia default first.",
    };
  }
  db.delete(paymentMethods).where(eq(paymentMethods.id, id)).run();
  return { ok: true };
}

export function reorderPaymentMethods(order: { id: string; orderIndex: number }[]): void {
  const now = new Date().toISOString();
  for (const item of order) {
    db.update(paymentMethods)
      .set({ orderIndex: item.orderIndex, updatedAt: now })
      .where(eq(paymentMethods.id, item.id))
      .run();
  }
}

export function isConfigured(method: PaymentMethodRow): boolean {
  return isMethodConfigured(method.preset, method.fields);
}
