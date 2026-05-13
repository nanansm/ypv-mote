"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatSessionDate,
  paymentStatusBadgeClasses,
} from "./sessions-format";
import { PaymentMethodBadge, type PaymentMethodLabel } from "./payment-method-badge";

type BookingRow = {
  booking: {
    id: string;
    submissionId: string;
    sessionId: string;
    bookingReference: string;
    paymentStatus: string;
    expiresAt: string | null;
    paidAt: string | null;
    confirmedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  submission: {
    id: string;
    fullName: string | null;
    email: string | null;
    country: string | null;
  } | null;
  session: {
    id: string;
    date: string;
    time: string;
    priceUsd: number;
    priceIdr: number | null;
  } | null;
  payment_method: PaymentMethodLabel;
};

type Props = {
  /** When set, the bookings list is locked to this session (used on the per-session page). */
  sessionIdLock?: string;
  /** When true, hide the "Session" column (used on the per-session page). */
  hideSessionColumn?: boolean;
};

export function BookingsTable({ sessionIdLock, hideSessionColumn }: Props) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [paymentStatus, setPaymentStatus] = useState("");
  const [sessionFilter, setSessionFilter] = useState(sessionIdLock ?? "");
  const [search, setSearch] = useState("");

  const [sessionOptions, setSessionOptions] = useState<
    { id: string; label: string }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    const effectiveSession = sessionIdLock ?? sessionFilter;
    if (effectiveSession) sp.set("session_id", effectiveSession);
    if (paymentStatus) sp.set("payment_status", paymentStatus);
    const res = await fetch(`/api/admin/bookings?${sp}`);
    const json = (await res.json()) as { bookings: BookingRow[] };
    setBookings(json.bookings ?? []);
    setLoading(false);
  }, [paymentStatus, sessionFilter, sessionIdLock]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (sessionIdLock) return;
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then(
        (d: {
          sessions: Array<{ id: string; date: string; time: string }>;
        }) => {
          setSessionOptions(
            (d.sessions ?? []).map((s) => ({
              id: s.id,
              label: `${formatSessionDate(s.date)} · ${s.time}`,
            }))
          );
        }
      )
      .catch(() => {});
  }, [sessionIdLock]);

  const filtered = useMemo(() => {
    if (!search) return bookings;
    const term = search.toLowerCase();
    return bookings.filter((b) => {
      const ref = b.booking.bookingReference.toLowerCase();
      const name = (b.submission?.fullName ?? "").toLowerCase();
      const email = (b.submission?.email ?? "").toLowerCase();
      return ref.includes(term) || name.includes(term) || email.includes(term);
    });
  }, [bookings, search]);

  async function action(
    id: string,
    endpoint: "mark-paid" | "mark-confirmed" | "cancel"
  ) {
    setActionMsg(null);
    const res = await fetch(`/api/admin/bookings/${id}/${endpoint}`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setActionMsg(data.error ?? `Action failed (${res.status})`);
      return;
    }
    setActionMsg(`Booking updated: ${endpoint.replace("-", " ")}`);
    await load();
  }

  function actionsFor(b: BookingRow) {
    const status = b.booking.paymentStatus;
    return (
      <div className="flex flex-wrap gap-1">
        {status === "pending" && (
          <button
            onClick={() => action(b.booking.id, "mark-paid")}
            className="px-2 py-1 text-[10px] rounded border border-[#3c3489] text-[#3c3489] hover:bg-[#f0effe]"
          >
            Mark paid
          </button>
        )}
        {status === "paid" && (
          <button
            onClick={() => action(b.booking.id, "mark-confirmed")}
            className="px-2 py-1 text-[10px] rounded border border-[#0f6e56] text-[#0f6e56] hover:bg-green-50"
          >
            Mark confirmed
          </button>
        )}
        {status !== "cancelled" && status !== "expired" && (
          <button
            onClick={() => {
              if (confirm("Cancel this booking?")) {
                void action(b.booking.id, "cancel");
              }
            }}
            className="px-2 py-1 text-[10px] rounded border border-[#a32d2d] text-[#a32d2d] hover:bg-red-50"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  const columns = hideSessionColumn
    ? [
        "Reference",
        "Submission",
        "Payment",
        "Status",
        "Created",
        "Expires",
        "Actions",
      ]
    : [
        "Reference",
        "Submission",
        "Session",
        "Payment",
        "Status",
        "Created",
        "Expires",
        "Actions",
      ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="text"
          placeholder="Search reference / name / email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 rounded-md border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489] w-64"
        />
        {!sessionIdLock && (
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none"
          >
            <option value="">All sessions</option>
            {sessionOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="confirmed">Confirmed</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {actionMsg && (
        <p className="text-xs text-[#5c5c5c] bg-[#fafaf9] border border-[#e5e5e5] px-3 py-2 rounded">
          {actionMsg}
        </p>
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              {columns.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[#5c5c5c]"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#5c5c5c]"
                >
                  {sessionIdLock
                    ? "No bookings for this session yet."
                    : "No bookings yet."}
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((b, i) => (
                <tr
                  key={b.booking.id}
                  className={`border-b border-[#f0f0f0] hover:bg-[#fafaf9] ${
                    i % 2 === 1 ? "bg-[#fafaf9]/30" : ""
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-[10px] text-[#1a1a1a]">
                    {b.booking.bookingReference}
                  </td>
                  <td className="px-4 py-2">
                    {b.submission ? (
                      <Link
                        href={`/admin/submissions/${b.submission.id}`}
                        className="text-[#3c3489] hover:underline"
                      >
                        {b.submission.fullName ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-[#5c5c5c]">—</span>
                    )}
                    <div className="text-[10px] text-[#5c5c5c]">
                      {b.submission?.email ?? ""}
                    </div>
                  </td>
                  {!hideSessionColumn && (
                    <td className="px-4 py-2 text-[#1a1a1a]">
                      {b.session ? (
                        <>
                          {formatSessionDate(b.session.date)}
                          <div className="text-[10px] text-[#5c5c5c]">
                            {b.session.time}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <PaymentMethodBadge method={b.payment_method} />
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${paymentStatusBadgeClasses(b.booking.paymentStatus)}`}
                    >
                      {b.booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[#5c5c5c]">
                    {b.booking.createdAt.split("T")[0]}
                  </td>
                  <td className="px-4 py-2 text-[#5c5c5c]">
                    {b.booking.paymentStatus === "pending" &&
                    b.booking.expiresAt
                      ? b.booking.expiresAt.split("T")[0]
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{actionsFor(b)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
