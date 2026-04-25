"use client";

import { useState, useEffect } from "react";

type Setting = { key: string; value: string; updatedAt: string | null };

const GROUPS: { label: string; keys: string[] }[] = [
  {
    label: "SMTP / Email",
    keys: ["smtp.host", "smtp.port", "smtp.user", "smtp.pass", "smtp.from"],
  },
  {
    label: "Webinar",
    keys: ["webinar.date", "webinar.time", "webinar.zoom_link", "webinar.payment_link"],
  },
  {
    label: "Google Sheets",
    keys: ["sheets.spreadsheet_id", "sheets.service_account_json"],
  },
  {
    label: "Groq AI",
    keys: ["groq.api_key", "groq.model"],
  },
  {
    label: "Admin",
    keys: ["admin.notification_email"],
  },
];

const SECRET_KEYS = new Set(["smtp.pass", "groq.api_key", "sheets.service_account_json"]);
const TEXTAREA_KEYS = new Set(["sheets.service_account_json"]);

export function SettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string } | null>>({});

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d: Setting[]) => {
        const map: Record<string, string> = {};
        for (const s of d) map[s.key] = s.value;
        setSettings(map);
        setLoading(false);
      });
  }, []);

  function setValue(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const body = Object.entries(settings).map(([key, value]) => ({ key, value }));
    await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test(endpoint: string, label: string) {
    setTestResults((r) => ({ ...r, [label]: null }));
    const res = await fetch(endpoint, { method: "POST" });
    const data = await res.json() as { ok: boolean; message?: string; error?: string };
    setTestResults((r) => ({ ...r, [label]: { ok: data.ok, msg: data.message ?? data.error ?? (data.ok ? "OK" : "Failed") } }));
  }

  if (loading) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      {GROUPS.map((group) => (
        <div key={group.label} className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">{group.label}</h2>
          {group.keys.map((key) => {
            const isSecret = SECRET_KEYS.has(key);
            const isTextarea = TEXTAREA_KEYS.has(key);
            const value = settings[key] ?? "";
            return (
              <label key={key} className="block">
                <span className="text-xs text-[#5c5c5c] block mb-1">{key}</span>
                {isTextarea ? (
                  <textarea value={value} onChange={(e) => setValue(key, e.target.value)} rows={4}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#3c3489] resize-y" />
                ) : (
                  <input
                    type={isSecret ? "password" : "text"}
                    value={value}
                    onChange={(e) => setValue(key, e.target.value)}
                    placeholder={isSecret && value === "••••••••" ? "Leave unchanged" : ""}
                    className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
                )}
              </label>
            );
          })}

          {/* Test buttons */}
          {group.label === "SMTP / Email" && (
            <TestButton label="smtp" endpoint="/api/admin/settings/test-smtp" result={testResults["smtp"]} onTest={() => test("/api/admin/settings/test-smtp", "smtp")} />
          )}
          {group.label === "Google Sheets" && (
            <TestButton label="sheets" endpoint="/api/admin/settings/test-sheets" result={testResults["sheets"]} onTest={() => test("/api/admin/settings/test-sheets", "sheets")} />
          )}
          {group.label === "Groq AI" && (
            <TestButton label="groq" endpoint="/api/admin/settings/test-groq" result={testResults["groq"]} onTest={() => test("/api/admin/settings/test-groq", "groq")} />
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 items-center">
        {saved && <span className="text-sm text-[#0f6e56]">Saved!</span>}
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770] disabled:opacity-60">
          {saving ? "Saving…" : "Save all settings"}
        </button>
      </div>
    </div>
  );
}

function TestButton({ label, endpoint, result, onTest }: {
  label: string;
  endpoint: string;
  result: { ok: boolean; msg: string } | null | undefined;
  onTest: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onTest}
        className="px-3 py-1.5 rounded border border-[#e5e5e5] text-xs hover:bg-[#fafaf9] transition-colors">
        Test {label}
      </button>
      {result !== undefined && result !== null && (
        <span className={`text-xs ${result.ok ? "text-[#0f6e56]" : "text-[#a32d2d]"}`}>
          {result.ok ? "✓" : "✗"} {result.msg}
        </span>
      )}
    </div>
  );
}
