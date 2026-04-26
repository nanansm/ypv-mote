"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Translation = { locale: string; label: string; placeholder?: string; helpText?: string };
type OptionTranslation = { locale: string; label: string };
type QuestionOption = { id?: number; value: string; order: number; translations: OptionTranslation[] };

type Question = {
  id: number;
  key: string;
  type: string;
  section: number;
  order: number;
  required: number;
  isEligibilityGate: number;
  validationRule: string | null;
  translations: Translation[];
  options: QuestionOption[];
};

const TYPES = ["text", "email", "tel", "select", "radio", "date", "textarea", "checkbox"];
const LOCALES = ["en", "de"] as const;

function emptyTranslations(): Translation[] {
  return LOCALES.map((l) => ({ locale: l, label: "", placeholder: "", helpText: "" }));
}

export function QuestionEditor({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";

  const [form, setForm] = useState({
    key: "",
    type: "text",
    section: 1,
    order: 1,
    required: 0,
    isEligibilityGate: 0,
    validationRule: "",
    translations: emptyTranslations(),
    options: [] as QuestionOption[],
  });
  const [activeTab, setActiveTab] = useState<"en" | "de">("en");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/questions/${id}`)
      .then((r) => r.json())
      .then((q: Question) => {
        const merged = emptyTranslations().map((t) => {
          const found = q.translations.find((x) => x.locale === t.locale);
          return found ? { ...t, ...found } : t;
        });
        setForm({
          key: q.key,
          type: q.type,
          section: q.section,
          order: q.order,
          required: q.required,
          isEligibilityGate: q.isEligibilityGate,
          validationRule: q.validationRule ?? "",
          translations: merged,
          options: q.options,
        });
        setLoading(false);
      });
  }, [id, isNew]);

  function setTranslation(locale: string, field: keyof Translation, value: string) {
    setForm((f) => ({
      ...f,
      translations: f.translations.map((t) => t.locale === locale ? { ...t, [field]: value } : t),
    }));
  }

  function addOption() {
    setForm((f) => ({
      ...f,
      options: [
        ...f.options,
        { value: "", order: f.options.length + 1, translations: LOCALES.map((l) => ({ locale: l, label: "" })) },
      ],
    }));
  }

  function removeOption(idx: number) {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, order: i + 1 })) }));
  }

  function setOptionField(idx: number, field: "value" | "order", value: string) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => i === idx ? { ...o, [field]: field === "order" ? parseInt(value) || 0 : value } : o),
    }));
  }

  function setOptionLabel(idx: number, locale: string, label: string) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === idx
          ? { ...o, translations: o.translations.map((t) => t.locale === locale ? { ...t, label } : t) }
          : o
      ),
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const body = {
        ...form,
        validationRule: form.validationRule || null,
        required: form.required,
        isEligibilityGate: form.isEligibilityGate,
      };
      if (isNew) {
        const res = await fetch("/api/admin/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json() as { id: number };
        router.replace(`/admin/questions/${data.id}`);
      } else {
        await fetch(`/api/admin/questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
    } catch {
      setError("Save failed. Please try again.");
    }
    setSaving(false);
  }

  async function doDelete() {
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    router.push("/admin/questions");
  }

  if (loading) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  const hasOptions = form.type === "select" || form.type === "radio";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/questions")} className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a]">← Questions</button>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">{isNew ? "New Question" : `Edit: ${form.key}`}</h1>
      </div>

      {error && <p className="text-sm text-[#a32d2d] bg-red-50 px-3 py-2 rounded">{error}</p>}

      {/* Core fields */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-4">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">Question Settings</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Key (slug)</span>
            <input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
          </label>
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Type</span>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full h-9 px-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Section</span>
            <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: parseInt(e.target.value) }))}
              className="w-full h-9 px-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none">
              {[1, 2, 3].map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">Order</span>
            <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 1 }))}
              className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
          </label>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.required} onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked ? 1 : 0 }))}
              className="accent-[#3c3489]" />
            Required
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.isEligibilityGate} onChange={(e) => setForm((f) => ({ ...f, isEligibilityGate: e.target.checked ? 1 : 0 }))}
              className="accent-[#3c3489]" />
            Eligibility gate
          </label>
        </div>

        <label className="block">
          <span className="text-xs text-[#5c5c5c] block mb-1">Validation rule (JSON, optional)</span>
          <textarea value={form.validationRule} onChange={(e) => setForm((f) => ({ ...f, validationRule: e.target.value }))} rows={2}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3c3489] resize-none" />
        </label>
      </div>

      {/* Translations */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        <div className="flex border-b border-[#e5e5e5]">
          {LOCALES.map((l) => (
            <button key={l} onClick={() => setActiveTab(l)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === l ? "text-[#3c3489] border-b-2 border-[#3c3489]" : "text-[#5c5c5c] hover:text-[#1a1a1a]"}`}>
              {l === "en" ? "English" : "Deutsch"}
            </button>
          ))}
        </div>
        {LOCALES.map((locale) => {
          const t = form.translations.find((x) => x.locale === locale)!;
          return (
            <div key={locale} className={`p-4 space-y-3 ${activeTab === locale ? "" : "hidden"}`}>
              <label className="block">
                <span className="text-xs text-[#5c5c5c] block mb-1">Label</span>
                <input value={t.label} onChange={(e) => setTranslation(locale, "label", e.target.value)}
                  className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
              </label>
              <label className="block">
                <span className="text-xs text-[#5c5c5c] block mb-1">Placeholder</span>
                <input value={t.placeholder ?? ""} onChange={(e) => setTranslation(locale, "placeholder", e.target.value)}
                  className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
              </label>
              <label className="block">
                <span className="text-xs text-[#5c5c5c] block mb-1">Help text</span>
                <input value={t.helpText ?? ""} onChange={(e) => setTranslation(locale, "helpText", e.target.value)}
                  className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]" />
              </label>
            </div>
          );
        })}
      </div>

      {/* Options (select/radio only) */}
      {hasOptions && (
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Options</h2>
            <button onClick={addOption} className="text-xs text-[#3c3489] hover:underline">+ Add option</button>
          </div>
          {form.options.length === 0 && <p className="text-xs text-[#5c5c5c]">No options yet.</p>}
          {form.options.map((opt, idx) => (
            <div key={idx} className="border border-[#e5e5e5] rounded-md p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input placeholder="value" value={opt.value} onChange={(e) => setOptionField(idx, "value", e.target.value)}
                  className="flex-1 h-8 px-2 border border-[#e5e5e5] rounded text-xs font-mono focus:outline-none" />
                <input type="number" placeholder="order" value={opt.order} onChange={(e) => setOptionField(idx, "order", e.target.value)}
                  className="w-16 h-8 px-2 border border-[#e5e5e5] rounded text-xs focus:outline-none" />
                <button onClick={() => removeOption(idx)} className="text-xs text-[#a32d2d] hover:underline shrink-0">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LOCALES.map((l) => (
                  <input key={l} placeholder={l === "en" ? "Label (EN)" : "Label (DE)"}
                    value={opt.translations.find((t) => t.locale === l)?.label ?? ""}
                    onChange={(e) => setOptionLabel(idx, l, e.target.value)}
                    className="h-8 px-2 border border-[#e5e5e5] rounded text-xs focus:outline-none" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        {!isNew && (
          <div>
            {confirmDelete ? (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-[#a32d2d]">Delete this question?</span>
                <button onClick={doDelete} className="text-xs text-white bg-[#a32d2d] px-3 py-1.5 rounded hover:bg-red-700">Yes, delete</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#5c5c5c] hover:text-[#1a1a1a]">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-sm text-[#a32d2d] hover:underline">Delete question</button>
            )}
          </div>
        )}
        <div className="ml-auto">
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770] transition-colors disabled:opacity-60">
            {saving ? "Saving…" : "Save question"}
          </button>
        </div>
      </div>
    </div>
  );
}
