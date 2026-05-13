export type Preset = "wise" | "revolut" | "paypal" | "custom_bank";

export const PRESETS: readonly Preset[] = [
  "wise",
  "revolut",
  "paypal",
  "custom_bank",
] as const;

export type WiseFields = {
  account_holder: string;
  account_number: string;
  swift_bic: string;
  bank_name: string;
  bank_address: string;
};

export type RevolutFields = {
  account_holder: string;
  revtag: string;
  account_number: string;
  swift_bic: string;
};

export type PaypalFields = {
  paypal_email: string;
  paypal_me_link: string;
};

export type CustomBankFields = {
  account_holder: string;
  account_number: string;
  bank_name: string;
  bank_branch: string;
  swift_bic: string;
};

export type PresetFields =
  | { preset: "wise"; fields: WiseFields }
  | { preset: "revolut"; fields: RevolutFields }
  | { preset: "paypal"; fields: PaypalFields }
  | { preset: "custom_bank"; fields: CustomBankFields };

export type AnyFields = Record<string, string>;

type FieldSpec = {
  name: string;
  labelEn: string;
  labelDe: string;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
};

export const PRESET_FIELDS: Record<Preset, FieldSpec[]> = {
  wise: [
    { name: "account_holder", labelEn: "Account holder", labelDe: "Kontoinhaber", required: true },
    { name: "account_number", labelEn: "Account / IBAN", labelDe: "Konto / IBAN", required: true },
    { name: "swift_bic", labelEn: "SWIFT / BIC", labelDe: "SWIFT / BIC", required: true },
    { name: "bank_name", labelEn: "Bank name", labelDe: "Bankname" },
    { name: "bank_address", labelEn: "Bank address", labelDe: "Bankadresse", multiline: true },
  ],
  revolut: [
    { name: "account_holder", labelEn: "Account holder", labelDe: "Kontoinhaber", required: true },
    { name: "revtag", labelEn: "Revtag", labelDe: "Revtag", placeholder: "@username", required: true },
    { name: "account_number", labelEn: "Account / IBAN (optional)", labelDe: "Konto / IBAN (optional)" },
    { name: "swift_bic", labelEn: "SWIFT / BIC (optional)", labelDe: "SWIFT / BIC (optional)" },
  ],
  paypal: [
    { name: "paypal_email", labelEn: "PayPal email", labelDe: "PayPal E-Mail", required: true },
    { name: "paypal_me_link", labelEn: "PayPal.me link (optional)", labelDe: "PayPal.me Link (optional)", placeholder: "https://paypal.me/username" },
  ],
  custom_bank: [
    { name: "account_holder", labelEn: "Account holder", labelDe: "Kontoinhaber", required: true },
    { name: "account_number", labelEn: "Account number", labelDe: "Kontonummer", required: true },
    { name: "bank_name", labelEn: "Bank name", labelDe: "Bankname", required: true },
    { name: "bank_branch", labelEn: "Branch (optional)", labelDe: "Filiale (optional)" },
    { name: "swift_bic", labelEn: "SWIFT / BIC (optional)", labelDe: "SWIFT / BIC (optional)" },
  ],
};

export const PRESET_DEFAULTS: Record<Preset, { displayName: string; currencyLabel: string }> = {
  wise: { displayName: "Wise", currencyLabel: "USD" },
  revolut: { displayName: "Revolut", currencyLabel: "EUR" },
  paypal: { displayName: "PayPal", currencyLabel: "USD" },
  custom_bank: { displayName: "Bank Transfer", currencyLabel: "USD" },
};

export function emptyFieldsFor(preset: Preset): AnyFields {
  const out: AnyFields = {};
  for (const f of PRESET_FIELDS[preset]) out[f.name] = "";
  return out;
}

export function isPreset(value: unknown): value is Preset {
  return typeof value === "string" && (PRESETS as readonly string[]).includes(value);
}

export function parseFields(json: string): AnyFields {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (parsed && typeof parsed === "object") {
      const out: AnyFields = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        out[k] = v == null ? "" : String(v);
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function sanitizeFields(preset: Preset, raw: AnyFields): AnyFields {
  const spec = PRESET_FIELDS[preset];
  const out: AnyFields = {};
  for (const f of spec) {
    out[f.name] = (raw[f.name] ?? "").toString();
  }
  return out;
}

export function isMethodConfigured(preset: Preset, fields: AnyFields): boolean {
  const required = PRESET_FIELDS[preset].filter((f) => f.required).map((f) => f.name);
  if (required.length === 0) {
    return Object.values(fields).some((v) => v && v.trim().length > 0);
  }
  return required.every((n) => (fields[n] ?? "").trim().length > 0);
}

export function currencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "CHF":
      return "CHF ";
    case "IDR":
      return "Rp ";
    default:
      return `${currency} `;
  }
}

export function formatAmount(amount: number, currency: string): string {
  const upper = currency.toUpperCase();
  if (upper === "IDR") {
    return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
  }
  const symbol = currencySymbol(upper);
  return `${symbol}${amount.toFixed(2)} ${upper}`;
}
