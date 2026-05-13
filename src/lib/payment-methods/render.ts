import type { PaymentMethodRow } from "./index";
import { PRESET_FIELDS } from "./presets";

export type RenderedField = {
  name: string;
  labelEn: string;
  labelDe: string;
  value: string;
};

export function renderFields(method: PaymentMethodRow): RenderedField[] {
  const spec = PRESET_FIELDS[method.preset];
  return spec.map((f) => ({
    name: f.name,
    labelEn: f.labelEn,
    labelDe: f.labelDe,
    value: method.fields[f.name] ?? "",
  }));
}

export function renderTextBlock(
  method: PaymentMethodRow,
  opts: { amountFormatted: string; locale?: "en" | "de" } = { amountFormatted: "" }
): string {
  const locale = opts.locale ?? "en";
  const lines: string[] = [];
  const methodLabel =
    locale === "de"
      ? `Methode: ${method.displayName} (${method.currencyLabel})`
      : `Method: ${method.displayName} (${method.currencyLabel})`;
  lines.push(methodLabel);
  if (opts.amountFormatted) {
    lines.push(locale === "de" ? `Betrag: ${opts.amountFormatted}` : `Amount: ${opts.amountFormatted}`);
  }
  for (const f of renderFields(method)) {
    if (!f.value) continue;
    const label = locale === "de" ? f.labelDe : f.labelEn;
    lines.push(`${label}: ${f.value}`);
  }
  return lines.join("\n");
}
