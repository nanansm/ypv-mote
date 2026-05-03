"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AiAnalysisPanel } from "./ai-analysis-panel";
import {
  formatSessionDate,
  paymentStatusBadgeClasses,
} from "./sessions-format";
import { PaymentMethodBadge } from "./payment-method-badge";

type Submission = {
  id: string;
  locale: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  dateOfBirth: string | null;
  ageAtSubmission: number | null;
  vocationalTrainingCompleted: number | null;
  interestedInField: number | null;
  englishLevel: string | null;
  workedAbroad: number | null;
  hasPassport: string | null;
  professionalExperience: string | null;
  diplomaInEnglish: number | null;
  currentLocation: string | null;
  eligibilityStatus: string;
  rejectionReasonKey: string | null;
  paymentStatus: string;
  paymentVerifiedAt: string | null;
  adminNotes: string | null;
  extraResponses: string | null;
  emailSentAt: string | null;
  sheetSyncedAt: string | null;
  createdAt: string;
};

type QuestionMeta = { key: string; label: string };

type BookingRecord = {
  booking: {
    id: string;
    sessionId: string;
    bookingReference: string;
    paymentStatus: string;
    expiresAt: string | null;
    paidAt: string | null;
    confirmedAt: string | null;
    createdAt: string;
  };
  session: {
    id: string;
    date: string;
    time: string;
    priceUsd: number;
    priceIdr: number | null;
    durationMinutes: number;
    status: string;
  } | null;
  payment_method: "bca" | "wise" | null;
};

export function SubmissionDetail({ id }: { id: string }) {
  const [sub, setSub] = useState<Submission | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionMeta, setQuestionMeta] = useState<QuestionMeta[]>([]);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [bookingLoaded, setBookingLoaded] = useState(false);
  const [bookingMsg, setBookingMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/questions")
      .then((r) => r.json())
      .then((qs: Array<{ key: string; translations: Array<{ locale: string; label: string }> }>) => {
        setQuestionMeta(qs.map((q) => ({
          key: q.key,
          label: q.translations.find((t) => t.locale === "en")?.label ?? q.key,
        })));
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/submissions/${id}`);
    const data = await res.json() as Submission;
    setSub(data);
    setNotes(data.adminNotes ?? "");
  }, [id]);

  const loadBooking = useCallback(async () => {
    const res = await fetch(`/api/admin/submissions/${id}/booking`);
    if (!res.ok) {
      setBookingLoaded(true);
      return;
    }
    const data = (await res.json()) as { booking: BookingRecord | null };
    setBooking(data.booking ?? null);
    setBookingLoaded(true);
  }, [id]);

  useEffect(() => { void load(); void loadBooking(); }, [load, loadBooking]);

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes: notes }),
    });
    setSaving(false);
  }

  async function bookingAction(endpoint: "mark-paid" | "mark-confirmed" | "cancel") {
    if (!booking?.booking) return;
    if (endpoint === "cancel" && !confirm("Cancel this booking?")) return;
    setBookingMsg("");
    const res = await fetch(
      `/api/admin/bookings/${booking.booking.id}/${endpoint}`,
      { method: "PATCH" }
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setBookingMsg(data.error ?? `Action failed (${res.status})`);
      return;
    }
    setBookingMsg(`Booking updated: ${endpoint.replace("-", " ")}`);
    await loadBooking();
  }

  async function action(endpoint: string, label: string) {
    setActionMsg("");
    const res = await fetch(`/api/admin/submissions/${id}/${endpoint}`, { method: "POST" });
    const data = await res.json() as { ok?: boolean; error?: string };
    setActionMsg(data.ok ? `${label} successful` : `${label} failed: ${data.error}`);
    await load();
  }

  async function softDelete() {
    await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deletedAt: new Date().toISOString() }),
    });
    window.location.href = "/admin/submissions";
  }

  if (!sub) return <div className="text-sm text-[#5c5c5c]">Loading…</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/submissions" className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a]">← Back</Link>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">{sub.fullName ?? "Unnamed"}</h1>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${sub.eligibilityStatus === "passed" ? "bg-green-50 text-[#0f6e56]" : "bg-red-50 text-[#a32d2d]"}`}>
          {sub.eligibilityStatus}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: form data */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Contact">
            <Field label="Name" value={sub.fullName} />
            <Field label="Email" value={sub.email} />
            <Field label="Phone" value={sub.phone} />
          </Section>

          <Section title="Eligibility">
            <Field label="Country" value={sub.country} />
            <Field label="Date of birth" value={sub.dateOfBirth} />
            <Field label="Age at submission" value={sub.ageAtSubmission} />
            <Field label="Vocational training" value={sub.vocationalTrainingCompleted === 1 ? "Yes" : "No"} />
            <Field label="Field interest" value={sub.interestedInField === 1 ? "Yes" : "No"} />
            {sub.rejectionReasonKey && <Field label="Rejection reason" value={sub.rejectionReasonKey} />}
          </Section>

          <Section title="General Info">
            <Field label="English level" value={sub.englishLevel} />
            <Field label="Worked abroad" value={sub.workedAbroad === 1 ? "Yes" : "No"} />
            <Field label="Passport" value={sub.hasPassport} />
            <Field label="Experience" value={sub.professionalExperience} />
            <Field label="Diploma in English" value={sub.diplomaInEnglish === 1 ? "Yes" : "No"} />
            <Field label="Current location" value={sub.currentLocation} />
          </Section>

          {sub.extraResponses && (() => {
            let parsed: Record<string, string> = {};
            try { parsed = JSON.parse(sub.extraResponses) as Record<string, string>; } catch { /* ignore */ }
            const entries = Object.entries(parsed);
            if (entries.length === 0) return null;
            return (
              <Section title="Additional Responses">
                {entries.map(([k, v]) => (
                  <Field
                    key={k}
                    label={questionMeta.find((q) => q.key === k)?.label ?? k}
                    value={v}
                  />
                ))}
              </Section>
            );
          })()}

          {/* Booking */}
          <Section title="Booking">
            {!bookingLoaded && (
              <p className="text-sm text-[#5c5c5c]">Loading booking…</p>
            )}
            {bookingLoaded && !booking && (
              <p className="text-sm text-[#5c5c5c]">
                User has not booked a session yet.
              </p>
            )}
            {bookingLoaded && booking && (
              <div className="space-y-3">
                {booking.session ? (
                  <>
                    <Field
                      label="Session"
                      value={`${formatSessionDate(booking.session.date)} · ${booking.session.time}`}
                    />
                    <Field
                      label="Price"
                      value={`$${booking.session.priceUsd.toFixed(2)}`}
                    />
                  </>
                ) : (
                  <Field label="Session" value="(deleted)" />
                )}
                <div className="flex justify-between text-sm py-1 border-b border-[#f0f0f0]">
                  <span className="text-[#5c5c5c]">Reference</span>
                  <span className="font-mono text-[#1a1a1a]">
                    {booking.booking.bookingReference}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-[#f0f0f0]">
                  <span className="text-[#5c5c5c]">Status</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${paymentStatusBadgeClasses(booking.booking.paymentStatus)}`}
                  >
                    {booking.booking.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-[#f0f0f0]">
                  <span className="text-[#5c5c5c]">Payment method</span>
                  <PaymentMethodBadge method={booking.payment_method} />
                </div>
                {booking.booking.paymentStatus === "pending" &&
                  booking.booking.expiresAt && (
                    <Field
                      label="Expires"
                      value={booking.booking.expiresAt.split("T")[0]}
                    />
                  )}
                {booking.booking.paidAt && (
                  <Field
                    label="Paid at"
                    value={booking.booking.paidAt.split("T")[0]}
                  />
                )}
                {booking.booking.confirmedAt && (
                  <Field
                    label="Confirmed at"
                    value={booking.booking.confirmedAt.split("T")[0]}
                  />
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {booking.booking.paymentStatus === "pending" && (
                    <button
                      onClick={() => bookingAction("mark-paid")}
                      className="px-3 py-1.5 rounded-md text-xs border border-[#3c3489] text-[#3c3489] hover:bg-[#f0effe]"
                    >
                      Mark paid
                    </button>
                  )}
                  {booking.booking.paymentStatus === "paid" && (
                    <button
                      onClick={() => bookingAction("mark-confirmed")}
                      className="px-3 py-1.5 rounded-md text-xs border border-[#0f6e56] text-[#0f6e56] hover:bg-green-50"
                    >
                      Mark confirmed
                    </button>
                  )}
                  {booking.booking.paymentStatus !== "cancelled" &&
                    booking.booking.paymentStatus !== "expired" && (
                      <button
                        onClick={() => bookingAction("cancel")}
                        className="px-3 py-1.5 rounded-md text-xs border border-[#a32d2d] text-[#a32d2d] hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                </div>
                {bookingMsg && (
                  <p className="text-xs text-[#5c5c5c]">{bookingMsg}</p>
                )}
              </div>
            )}
          </Section>

          {/* Admin notes */}
          <Section title="Admin Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-[#e5e5e5] text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
              placeholder="Internal notes…"
            />
            {saving && <p className="text-xs text-[#5c5c5c]">Saving…</p>}
          </Section>
        </div>

        {/* Right: AI + actions */}
        <div className="space-y-4">
          <AiAnalysisPanel submissionId={id} />

          <Section title="Actions">
            <div className="space-y-2">
              <ActionBtn onClick={() => action("resend", "Resend email")}>Resend eligibility email</ActionBtn>
              <ActionBtn onClick={() => action("resync", "Sheet resync")}>Resync to Google Sheets</ActionBtn>
              {sub.paymentStatus !== "pending" && (
                <ActionBtn onClick={() => action("send-zoom", "Zoom email")}>Send Zoom link</ActionBtn>
              )}
              <ActionBtn danger onClick={() => setShowDeleteConfirm(true)}>Delete (soft)</ActionBtn>
            </div>
            {actionMsg && <p className="text-xs mt-2 text-[#5c5c5c]">{actionMsg}</p>}
            {showDeleteConfirm && (
              <div className="mt-3 p-3 rounded-md border border-[#a32d2d] bg-red-50 text-xs">
                <p className="text-[#a32d2d] mb-2">This will soft-delete the submission. Continue?</p>
                <div className="flex gap-2">
                  <button onClick={softDelete} className="px-3 py-1 rounded bg-[#a32d2d] text-white">Delete</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 rounded border border-[#e5e5e5]">Cancel</button>
                </div>
              </div>
            )}
          </Section>

          <Section title="Metadata">
            <Field label="Submitted" value={sub.createdAt.split("T")[0]} />
            <Field label="Locale" value={sub.locale} />
            <Field label="Email sent" value={sub.emailSentAt ? sub.emailSentAt.split("T")[0] : "—"} />
            <Field label="Sheet synced" value={sub.sheetSyncedAt ? sub.sheetSyncedAt.split("T")[0] : "—"} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <h3 className="text-xs font-semibold text-[#5c5c5c] uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-[#f0f0f0] last:border-0">
      <span className="text-[#5c5c5c]">{label}</span>
      <span className="text-[#1a1a1a] font-medium text-right max-w-[55%] break-words">{value ?? "—"}</span>
    </div>
  );
}

function ActionBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-xs border transition-colors ${
        danger
          ? "border-[#a32d2d] text-[#a32d2d] hover:bg-red-50"
          : "border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#fafaf9]"
      }`}
    >
      {children}
    </button>
  );
}
