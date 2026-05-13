"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PRESET_FIELDS,
  PRESET_DEFAULTS,
  emptyFieldsFor,
  type AnyFields,
  type Preset,
} from "@/lib/payment-methods/presets";
import { AdminModal } from "@/components/admin/ui/modal";
import { AdminButton } from "@/components/admin/ui/button";

type ApiMethod = {
  id: string;
  key: string;
  displayName: string;
  currencyLabel: string;
  preset: Preset;
  fields: AnyFields;
  isActive: boolean;
  isDefaultForIndonesia: boolean;
  orderIndex: number;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  method?: ApiMethod | null;
  presetForCreate?: Preset | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PaymentMethodForm({
  open,
  mode,
  method,
  presetForCreate,
  onClose,
  onSaved,
}: Props) {
  const preset: Preset | null =
    mode === "edit" ? method?.preset ?? null : presetForCreate ?? null;

  const [displayName, setDisplayName] = useState("");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [fields, setFields] = useState<AnyFields>({});
  const [isActive, setIsActive] = useState(true);
  const [isDefaultForIndonesia, setIsDefaultForIndonesia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && method) {
      setDisplayName(method.displayName);
      setCurrencyLabel(method.currencyLabel);
      setFields({ ...method.fields });
      setIsActive(method.isActive);
      setIsDefaultForIndonesia(method.isDefaultForIndonesia);
    } else if (mode === "create" && presetForCreate) {
      const def = PRESET_DEFAULTS[presetForCreate];
      setDisplayName(def.displayName);
      setCurrencyLabel(def.currencyLabel);
      setFields(emptyFieldsFor(presetForCreate));
      setIsActive(true);
      setIsDefaultForIndonesia(false);
    }
    setError(null);
  }, [open, mode, method, presetForCreate]);

  const spec = useMemo(() => (preset ? PRESET_FIELDS[preset] : []), [preset]);

  if (!open || !preset) return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        displayName,
        currencyLabel,
        fields,
        isActive,
        isDefaultForIndonesia,
        ...(mode === "create" ? { preset } : {}),
      };
      const url =
        mode === "create"
          ? "/api/admin/payment-methods"
          : `/api/admin/payment-methods/${method!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Failed (${res.status})`);
        setSaving(false);
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  const title = `${mode === "create" ? "Add" : "Edit"} payment method · ${PRESET_DEFAULTS[preset].displayName} preset`;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">
              Display name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
            />
          </label>
          <label className="block">
            <span className="text-xs text-[#5c5c5c] block mb-1">
              Currency label
            </span>
            <input
              value={currencyLabel}
              onChange={(e) => setCurrencyLabel(e.target.value.toUpperCase())}
              placeholder="USD, EUR, IDR…"
              className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
            />
          </label>
        </div>

        <div className="space-y-3">
          {spec.map((f) => {
            const value = fields[f.name] ?? "";
            const onChange = (v: string) =>
              setFields((s) => ({ ...s, [f.name]: v }));
            return (
              <label key={f.name} className="block">
                <span className="text-xs text-[#5c5c5c] block mb-1">
                  {f.labelEn}
                  {f.required && <span className="text-[#a32d2d]"> *</span>}
                </span>
                {f.multiline ? (
                  <textarea
                    value={value}
                    placeholder={f.placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489] resize-y"
                  />
                ) : (
                  <input
                    value={value}
                    placeholder={f.placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-9 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="border-t border-[#e5e5e5] pt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[#e5e5e5]"
            />
            Active (shown to applicants)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDefaultForIndonesia}
              onChange={(e) => setIsDefaultForIndonesia(e.target.checked)}
              className="rounded border-[#e5e5e5]"
            />
            Set as default for Indonesia users
          </label>
          <p className="text-xs text-[#5c5c5c] ml-6">
            Indonesian applicants will see only this method. Other applicants
            see all other active methods.
          </p>
        </div>

        {error && (
          <p className="text-xs text-[#a32d2d] bg-red-50 border border-red-100 rounded px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </AdminModal>
  );
}
