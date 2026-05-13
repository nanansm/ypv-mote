"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PRESET_DEFAULTS,
  PRESET_FIELDS,
  isMethodConfigured,
  type AnyFields,
  type Preset,
} from "@/lib/payment-methods/presets";
import { PresetSelector } from "./preset-selector";
import { PaymentMethodForm } from "./payment-method-form";
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

export function PaymentMethodsManager() {
  const [methods, setMethods] = useState<ApiMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [presetForCreate, setPresetForCreate] = useState<Preset | null>(null);
  const [editing, setEditing] = useState<ApiMethod | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/payment-methods");
    const data = (await res.json()) as { methods: ApiMethod[] };
    setMethods(data.methods ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(m: ApiMethod) {
    await fetch(`/api/admin/payment-methods/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    await load();
  }

  async function remove(m: ApiMethod) {
    if (!confirm(`Delete ${m.displayName}?`)) return;
    const res = await fetch(`/api/admin/payment-methods/${m.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setActionMsg(data.error ?? `Delete failed (${res.status})`);
      return;
    }
    setActionMsg(`${m.displayName} deleted.`);
    await load();
  }

  function startCreate() {
    setPresetForCreate(null);
    setShowPresetPicker(true);
  }

  function pickPreset(preset: Preset) {
    setPresetForCreate(preset);
    setShowPresetPicker(false);
  }

  async function persistOrder(newOrder: ApiMethod[]) {
    const payload = newOrder.map((m, i) => ({ id: m.id, orderIndex: i }));
    await fetch("/api/admin/payment-methods/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await load();
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const from = methods.findIndex((m) => m.id === dragId);
    const to = methods.findIndex((m) => m.id === targetId);
    if (from === -1 || to === -1) {
      setDragId(null);
      return;
    }
    const next = methods.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setMethods(next);
    setDragId(null);
    void persistOrder(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1a1a1a]">
            Payment Methods
          </h2>
          <p className="text-xs text-[#5c5c5c] mt-0.5">
            Drag to reorder. Order affects success-page tabs and the default for email.
          </p>
        </div>
        <AdminButton onClick={startCreate}>+ Add Method</AdminButton>
      </div>

      {actionMsg && (
        <p className="text-xs text-[#5c5c5c] bg-[#fafaf9] border border-[#e5e5e5] px-3 py-2 rounded">
          {actionMsg}
        </p>
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        {loading && (
          <p className="p-6 text-sm text-[#5c5c5c]">Loading…</p>
        )}
        {!loading && methods.length === 0 && (
          <p className="p-6 text-sm text-[#5c5c5c]">
            No payment methods yet. Add one to get started.
          </p>
        )}
        {!loading &&
          methods.map((m, i) => {
            const configured = isMethodConfigured(m.preset, m.fields);
            const required = PRESET_FIELDS[m.preset]
              .filter((f) => f.required)
              .map((f) => f.name);
            return (
              <div
                key={m.id}
                draggable
                onDragStart={() => setDragId(m.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(m.id)}
                onDragEnd={() => setDragId(null)}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                  i > 0 ? "border-t border-[#f0f0f0]" : ""
                } ${dragId === m.id ? "opacity-50" : ""} hover:bg-[#fafaf9]`}
              >
                <span
                  className="cursor-grab text-[#a0a0a0] select-none"
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      {m.displayName}
                    </span>
                    <span className="text-xs text-[#5c5c5c]">
                      {m.currencyLabel}
                    </span>
                    <span className="text-[10px] text-[#5c5c5c] font-mono bg-[#fafaf9] px-1.5 py-0.5 rounded">
                      {m.key}
                    </span>
                    <span className="text-[10px] text-[#5c5c5c]">
                      ({PRESET_DEFAULTS[m.preset].displayName} preset)
                    </span>
                    {m.isDefaultForIndonesia && (
                      <span className="text-[10px] font-medium text-[#0f6e56] bg-green-50 px-1.5 py-0.5 rounded">
                        🇮🇩 Indonesia default
                      </span>
                    )}
                    {!configured && (
                      <span className="text-[10px] font-medium text-[#996e00] bg-amber-50 px-1.5 py-0.5 rounded">
                        Missing: {required.join(", ") || "fields"}
                      </span>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#5c5c5c]">
                  <input
                    type="checkbox"
                    checked={m.isActive}
                    onChange={() => toggleActive(m)}
                    className="rounded border-[#e5e5e5]"
                  />
                  {m.isActive ? (
                    <span className="text-[#0f6e56] font-medium">Active</span>
                  ) : (
                    "Inactive"
                  )}
                </label>
                <AdminButton variant="secondary" size="sm" onClick={() => setEditing(m)}>
                  Edit
                </AdminButton>
                <AdminButton variant="destructive" size="sm" onClick={() => remove(m)}>
                  Delete
                </AdminButton>
              </div>
            );
          })}
      </div>

      <AdminModal
        open={showPresetPicker}
        onClose={() => setShowPresetPicker(false)}
        title="Choose a preset"
      >
        <PresetSelector value={presetForCreate} onChange={pickPreset} />
      </AdminModal>

      <PaymentMethodForm
        open={presetForCreate !== null}
        mode="create"
        presetForCreate={presetForCreate}
        onClose={() => setPresetForCreate(null)}
        onSaved={() => load()}
      />

      <PaymentMethodForm
        open={editing !== null}
        mode="edit"
        method={editing}
        onClose={() => setEditing(null)}
        onSaved={() => load()}
      />
    </div>
  );
}
