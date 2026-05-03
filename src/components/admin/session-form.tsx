"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type SessionRecord = {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  priceUsd: number;
  priceIdr: number | null;
  zoomLink: string | null;
  description: string | null;
  status: string;
  paid_count: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionRecord | null;
  onSaved: () => void;
};

type FormState = {
  date: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  priceUsd: number;
  priceIdr: string;
  zoomLink: string;
  description: string;
  status: "draft" | "published" | "closed";
};

const DEFAULT_FORM: FormState = {
  date: "",
  time: "14:00",
  durationMinutes: 120,
  capacity: 50,
  priceUsd: 15,
  priceIdr: "",
  zoomLink: "",
  description: "",
  status: "draft",
};

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputCls =
  "w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3c3489] disabled:bg-[#fafaf9] disabled:text-[#5c5c5c] disabled:cursor-not-allowed";

export function SessionForm({ open, onOpenChange, session, onSaved }: Props) {
  const isEdit = !!session;
  const hasPaidBookings = (session?.paid_count ?? 0) > 0;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (session) {
      setForm({
        date: session.date,
        time: session.time,
        durationMinutes: session.durationMinutes,
        capacity: session.capacity,
        priceUsd: session.priceUsd,
        priceIdr:
          session.priceIdr != null ? String(session.priceIdr) : "",
        zoomLink: session.zoomLink ?? "",
        description: session.description ?? "",
        status: (session.status as FormState["status"]) ?? "draft",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError(null);
  }, [open, session]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.date) return "Date is required";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return "Date must be YYYY-MM-DD";
    if (!isEdit && form.date < todayIso()) {
      return "Date must be today or in the future";
    }
    if (!form.time) return "Time is required";
    if (!/^\d{2}:\d{2}$/.test(form.time)) return "Time must be HH:mm";
    if (form.durationMinutes < 1) return "Duration must be at least 1 minute";
    if (form.capacity < 1) return "Capacity must be at least 1";
    if (form.priceUsd < 0) return "Price (USD) must be non-negative";
    if (form.priceIdr.trim()) {
      const n = Number(form.priceIdr);
      if (!Number.isFinite(n) || n < 0) {
        return "Price (IDR) must be a non-negative whole number, or empty";
      }
    }
    if (form.zoomLink && !isValidUrl(form.zoomLink)) {
      return "Zoom link must be a valid URL";
    }
    if (form.status === "published" && !form.zoomLink) {
      return "Zoom link is required when publishing";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);

    const trimmedIdr = form.priceIdr.trim();
    const payload: Record<string, unknown> = {
      time: form.time,
      duration_minutes: form.durationMinutes,
      capacity: form.capacity,
      price_usd: form.priceUsd,
      price_idr: trimmedIdr ? Math.round(Number(trimmedIdr)) : null,
      zoom_link: form.zoomLink || null,
      description: form.description || null,
      status: form.status,
    };
    if (!isEdit || !hasPaidBookings) {
      payload.date = form.date;
    }

    const url = isEdit
      ? `/api/admin/sessions/${session!.id}`
      : "/api/admin/sessions";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? `Save failed (${res.status})`);
      return;
    }
    onSaved();
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit session" : "New session"}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/50"
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[calc(100vh-2rem)] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5]">
          <h2 className="text-base font-semibold text-[#1a1a1a]">
            {isEdit ? "Edit session" : "New session"}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#fafaf9] text-[#5c5c5c]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Date" required>
              <input
                type="date"
                required
                value={form.date}
                disabled={isEdit && hasPaidBookings}
                onChange={(e) => setField("date", e.target.value)}
                className={inputCls}
              />
              {isEdit && hasPaidBookings && (
                <p className="text-[11px] text-[#a32d2d] mt-1">
                  Date is locked because this session has paid bookings.
                </p>
              )}
            </Field>
            <Field label="Time" required>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setField("time", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Duration (minutes)">
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) =>
                  setField(
                    "durationMinutes",
                    parseInt(e.target.value || "0", 10)
                  )
                }
                className={inputCls}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) =>
                  setField("capacity", parseInt(e.target.value || "0", 10))
                }
                className={inputCls}
              />
            </Field>
            <Field label="Price (USD)" required>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.priceUsd}
                onChange={(e) =>
                  setField("priceUsd", parseFloat(e.target.value || "0"))
                }
                className={inputCls}
              />
            </Field>
            <Field label="Price (IDR)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#5c5c5c] pointer-events-none">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="240000"
                  value={form.priceIdr}
                  onChange={(e) => setField("priceIdr", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              {!form.priceIdr.trim() && (
                <p className="text-[11px] text-[#996e00] mt-1">
                  IDR price empty — Indonesian users will see USD instructions instead.
                </p>
              )}
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  setField("status", e.target.value as FormState["status"])
                }
                className={inputCls}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
          </div>

          <Field label="Zoom link">
            <input
              type="url"
              placeholder="https://zoom.us/j/..."
              value={form.zoomLink}
              onChange={(e) => setField("zoomLink", e.target.value)}
              className={inputCls}
            />
            <p className="text-[11px] text-[#5c5c5c] mt-1">
              Required when status is &quot;Published&quot;.
            </p>
          </Field>

          <Field label="Description (optional)">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className={`${inputCls} resize-y min-h-[72px]`}
            />
          </Field>

          {error && (
            <p className="text-xs text-[#a32d2d] bg-red-50 border border-red-100 px-3 py-2 rounded">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-[#e5e5e5] bg-[#fafaf9] rounded-b-lg">
          {isEdit ? (
            <Link
              href={`/admin/sessions/${session!.id}/bookings`}
              className="text-xs text-[#3c3489] hover:underline text-center sm:text-left"
            >
              View bookings for this session →
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-md border border-[#e5e5e5] text-sm hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770] disabled:opacity-60"
            >
              {submitting
                ? "Saving…"
                : isEdit
                ? "Save changes"
                : "Create session"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[#5c5c5c] block mb-1">
        {label}
        {required && <span className="text-[#a32d2d] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
