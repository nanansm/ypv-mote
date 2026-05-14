"use client";

import { useMemo, useState } from "react";

export type PublicPaymentMethod = {
  id: string;
  key: string;
  displayName: string;
  currencyLabel: string;
  preset: "wise" | "revolut" | "paypal" | "custom_bank";
  fields: Record<string, string>;
  payViaLabel: string;
};

type FieldRenderSpec = {
  name: string;
  label: string;
  fallback?: string;
};

type Props = {
  methods: PublicPaymentMethod[];
  bookingReference: string;
  amountUsd: number;
  labels: {
    referenceLabel: string;
    amountLabel: string;
    notConfigured: string;
    fieldLabels: Record<string, string>;
  };
};

function formatAmount(amount: number, currency: string): string {
  const upper = currency.toUpperCase();
  if (upper === "IDR") return `Rp ${Math.round(amount).toLocaleString("id-ID")}`;
  const symbol =
    upper === "USD"
      ? "$"
      : upper === "EUR"
        ? "€"
        : upper === "GBP"
          ? "£"
          : `${upper} `;
  return `${symbol}${amount.toFixed(2)} ${upper}`;
}

function fieldsFor(method: PublicPaymentMethod, labels: Props["labels"]): FieldRenderSpec[] {
  const L = labels.fieldLabels;
  switch (method.preset) {
    case "wise":
      return [
        { name: "account_holder", label: L.account_holder, fallback: labels.notConfigured },
        { name: "account_number", label: L.account_number, fallback: labels.notConfigured },
        { name: "swift_bic", label: L.swift_bic, fallback: labels.notConfigured },
        { name: "bank_name", label: L.bank_name },
        { name: "bank_address", label: L.bank_address },
      ];
    case "revolut":
      return [
        { name: "account_holder", label: L.account_holder, fallback: labels.notConfigured },
        { name: "revtag", label: L.revtag, fallback: labels.notConfigured },
        { name: "account_number", label: L.account_number },
        { name: "swift_bic", label: L.swift_bic },
      ];
    case "paypal":
      return [
        { name: "paypal_email", label: L.paypal_email, fallback: labels.notConfigured },
        { name: "paypal_me_link", label: L.paypal_me_link },
      ];
    case "custom_bank":
      return [
        { name: "account_holder", label: L.account_holder, fallback: labels.notConfigured },
        { name: "account_number", label: L.account_number, fallback: labels.notConfigured },
        { name: "bank_name", label: L.bank_name },
        { name: "bank_branch", label: L.bank_branch },
        { name: "swift_bic", label: L.swift_bic },
      ];
  }
}

export function PaymentMethodTabs({
  methods,
  bookingReference,
  amountUsd,
  labels,
}: Props) {
  const [activeId, setActiveId] = useState<string>(methods[0]?.id ?? "");
  const active = useMemo(
    () => methods.find((m) => m.id === activeId) ?? methods[0],
    [methods, activeId]
  );

  if (!active) return null;
  const renderFields = fieldsFor(active, labels);
  const amountFormatted = formatAmount(amountUsd, active.currencyLabel);

  return (
    <div>
      {methods.length > 1 && (
        <div
          role="tablist"
          aria-label="Payment methods"
          className="flex flex-wrap gap-1 border-b border-[#e5e5e5] mb-3"
        >
          {methods.map((m) => {
            const isActive = m.id === active.id;
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(m.id)}
                className={`px-3 py-2 text-sm -mb-px border-b-2 transition-colors ${
                  isActive
                    ? "border-[#3c3489] text-[#3c3489] font-medium"
                    : "border-transparent text-[#5c5c5c] hover:text-[#1a1a1a]"
                }`}
              >
                {m.displayName} · {m.currencyLabel}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs font-medium text-[#3c3489] mb-2">
        {active.payViaLabel}
      </p>

      <div className="bg-[#fafaf9] border border-[#e5e5e5] rounded-md p-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-[#5c5c5c]">{labels.amountLabel}</span>
          <span className="text-[#1a1a1a] font-semibold">{amountFormatted}</span>
        </div>
        {renderFields.map((f) => {
          const value = active.fields[f.name] ?? "";
          const display = value || f.fallback || "";
          if (!value && !f.fallback) return null;
          return (
            <div key={f.name} className="flex justify-between gap-4">
              <span className="text-[#5c5c5c] flex-shrink-0">{f.label}</span>
              <span
                className={`text-right break-words ${
                  value ? "text-[#1a1a1a] font-medium" : "text-[#5c5c5c] italic"
                }`}
              >
                {display}
              </span>
            </div>
          );
        })}
        <div className="pt-2 mt-2 border-t border-[#e5e5e5]">
          <p className="text-xs text-[#5c5c5c] mb-1">{labels.referenceLabel}</p>
          <p className="font-mono text-sm font-semibold text-[#1a1a1a] break-all">
            {bookingReference}
          </p>
        </div>
      </div>
    </div>
  );
}
