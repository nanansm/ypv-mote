"use client";

import { useState, useEffect, useCallback } from "react";

export type SettingsTab = "general" | "payment_methods" | "integrations" | "email";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "payment_methods", label: "Payment Methods" },
  { id: "integrations", label: "Integrations" },
  { id: "email", label: "Email" },
];

function getInitialTab(): SettingsTab {
  if (typeof window === "undefined") return "general";
  const hash = window.location.hash.replace("#", "");
  if (TABS.some((t) => t.id === hash)) return hash as SettingsTab;
  return "general";
}

export function SettingsTabs({
  children,
}: {
  children: (tab: SettingsTab) => React.ReactNode;
}) {
  const [tab, setTab] = useState<SettingsTab>("general");

  useEffect(() => {
    setTab(getInitialTab());
    const onHash = () => setTab(getInitialTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const select = useCallback((id: SettingsTab) => {
    setTab(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  return (
    <>
      <nav
        role="tablist"
        aria-label="Settings sections"
        className="flex flex-wrap gap-1 border-b border-[#e5e5e5] mb-6 -mx-1"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => select(t.id)}
              className={`px-4 py-2 text-sm transition-colors -mb-px border-b-2 ${
                active
                  ? "border-[#3c3489] text-[#3c3489] font-medium"
                  : "border-transparent text-[#5c5c5c] hover:text-[#1a1a1a]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
      <div role="tabpanel">{children(tab)}</div>
    </>
  );
}
