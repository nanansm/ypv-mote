"use client";

import type { Preset } from "@/lib/payment-methods/presets";

const OPTIONS: { value: Preset; label: string; description: string; icon: string }[] = [
  {
    value: "wise",
    label: "Wise",
    description: "USD/EUR/multi-currency transfers (IBAN + SWIFT/BIC).",
    icon: "↗",
  },
  {
    value: "revolut",
    label: "Revolut",
    description: "Send via Revtag or IBAN. Great for EUR/GBP.",
    icon: "◐",
  },
  {
    value: "paypal",
    label: "PayPal",
    description: "PayPal email + optional PayPal.me link.",
    icon: "P",
  },
  {
    value: "custom_bank",
    label: "Custom Bank",
    description: "Any local bank — name, account, optional SWIFT/branch.",
    icon: "🏦",
  },
];

type Props = {
  value: Preset | null;
  onChange: (preset: Preset) => void;
};

export function PresetSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left px-4 py-3 rounded-md border transition-colors ${
              active
                ? "border-[#3c3489] bg-[#f0effe]"
                : "border-[#e5e5e5] bg-white hover:bg-[#fafaf9]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none">{opt.icon}</span>
              <div>
                <p
                  className={`text-sm font-medium ${active ? "text-[#3c3489]" : "text-[#1a1a1a]"}`}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-[#5c5c5c] mt-1">{opt.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
