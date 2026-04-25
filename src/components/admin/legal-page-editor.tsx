"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Translation = { locale: string; title: string; bodyMarkdown: string };
type LegalPage = { id: number; slug: string; updatedAt: string | null; translations: Translation[] };

const LOCALES = ["en", "zh"] as const;

export function LegalPageEditor({
  slug,
  backHref = "/admin/legal",
  backLabel = "Legal Pages",
  title,
}: {
  slug: string;
  backHref?: string;
  backLabel?: string;
  title?: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [activeLocale, setActiveLocale] = useState<"en" | "zh">("en");
  const [drafts, setDrafts] = useState<Record<string, { title: string; body: string }>>({
    en: { title: "", body: "" },
    zh: { title: "", body: "" },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/legal/${slug}`)
      .then((r) => r.json())
      .then((d: LegalPage) => {
        setPage(d);
        const updated: typeof drafts = { en: { title: "", body: "" }, zh: { title: "", body: "" } };
        for (const t of d.translations) {
          if (t.locale === "en" || t.locale === "zh") {
            updated[t.locale] = { title: t.title, body: t.bodyMarkdown };
          }
        }
        setDrafts(updated);
      });
  }, [slug]);

  async function save() {
    setSaving(true);
    const draft = drafts[activeLocale];
    await fetch(`/api/admin/legal/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: activeLocale, title: draft.title, bodyMarkdown: draft.body }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!page) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  const draft = drafts[activeLocale];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push(backHref)} className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a]">← {backLabel}</button>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">{title ?? page.slug}</h1>
      </div>

      {/* Locale tabs */}
      <div className="flex border-b border-[#e5e5e5] mb-4">
        {LOCALES.map((l) => (
          <button key={l} onClick={() => setActiveLocale(l)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeLocale === l ? "text-[#3c3489] border-b-2 border-[#3c3489]" : "text-[#5c5c5c] hover:text-[#1a1a1a]"}`}>
            {l === "en" ? "English" : "中文"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs text-[#5c5c5c] block mb-1">Title</span>
          <input value={draft.title} onChange={(e) => setDrafts((d) => ({ ...d, [activeLocale]: { ...d[activeLocale], title: e.target.value } }))}
            className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
        </label>

        <div className="grid lg:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Markdown</span>
            <textarea value={draft.body} onChange={(e) => setDrafts((d) => ({ ...d, [activeLocale]: { ...d[activeLocale], body: e.target.value } }))} rows={22}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3c3489] resize-none" />
          </label>

          {showPreview && (
            <div>
              <span className="text-xs text-[#5c5c5c] block mb-1">Preview</span>
              <div className="border border-[#e5e5e5] rounded-md p-3 h-[calc(22*1.5rem+1rem)] overflow-y-auto bg-white prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm font-sans text-[#1a1a1a]">{draft.body}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 items-center">
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setShowPreview((p) => !p)}
            className="px-4 py-2 rounded-md border border-[#e5e5e5] text-sm hover:bg-[#fafaf9]">
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          {saved && <span className="text-sm text-[#0f6e56]">Saved!</span>}
        </div>
      </div>
    </div>
  );
}
