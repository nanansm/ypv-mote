"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Submission = {
  id: string;
  fullName: string | null;
  email: string | null;
  country: string | null;
  ageAtSubmission: number | null;
  eligibilityStatus: string;
  paymentStatus: string;
  createdAt: string;
};

type ListResponse = { rows: Submission[]; total: number; page: number; pages: number };

const PAYMENT_STATUSES = ["", "pending", "paid", "confirmed", "attended", "no_show"];

export function SubmissionsManager() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [eligibility, setEligibility] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/eligibility")
      .then((r) => r.json())
      .then((d: { validCountries?: string | string[] }) => {
        const raw = d.validCountries;
        if (!raw) return;
        const list = typeof raw === "string" ? (JSON.parse(raw) as string[]) : raw;
        setCountries(list.sort());
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(page) });
    if (eligibility) sp.set("eligibility", eligibility);
    if (paymentStatus) sp.set("paymentStatus", paymentStatus);
    if (country) sp.set("country", country);
    if (search) sp.set("search", search);
    const res = await fetch(`/api/admin/submissions?${sp}`);
    const json = await res.json() as ListResponse;
    setData(json);
    setLoading(false);
  }, [page, eligibility, paymentStatus, country, search]);

  useEffect(() => { void load(); }, [load]);

  function exportCsv() {
    const sp = new URLSearchParams();
    if (eligibility) sp.set("eligibility", eligibility);
    if (paymentStatus) sp.set("paymentStatus", paymentStatus);
    if (country) sp.set("country", country);
    if (search) sp.set("search", search);
    window.open(`/api/admin/submissions/export?${sp}`, "_blank");
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-[#e5e5e5] text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489] w-52"
        />
        <select value={eligibility} onChange={(e) => { setEligibility(e.target.value); setPage(1); }}
          className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none">
          <option value="">All eligibility</option>
          <option value="passed">Passed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
          className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none">
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s || "All payment status"}</option>)}
        </select>
        <select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }}
          className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none">
          <option value="">All countries</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={exportCsv} className="h-9 px-4 rounded-md border border-[#e5e5e5] text-sm text-[#1a1a1a] hover:bg-[#fafaf9] transition-colors">
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              {["Name", "Email", "Country", "Age", "Eligibility", "Payment", "Submitted"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#5c5c5c]">Loading…</td></tr>
            )}
            {!loading && data?.rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-[#f0f0f0] hover:bg-[#fafaf9] ${i % 2 === 1 ? "bg-[#fafaf9]/30" : ""}`}>
                <td className="px-4 py-2">
                  <Link href={`/admin/submissions/${r.id}`} className="text-[#3c3489] hover:underline">{r.fullName ?? "—"}</Link>
                </td>
                <td className="px-4 py-2">{r.email ?? "—"}</td>
                <td className="px-4 py-2">{r.country ?? "—"}</td>
                <td className="px-4 py-2">{r.ageAtSubmission ?? "—"}</td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.eligibilityStatus === "passed" ? "text-[#0f6e56] bg-green-50" : "text-[#a32d2d] bg-red-50"}`}>
                    {r.eligibilityStatus}
                  </span>
                </td>
                <td className="px-4 py-2">{r.paymentStatus}</td>
                <td className="px-4 py-2">{r.createdAt.split("T")[0]}</td>
              </tr>
            ))}
            {!loading && data?.rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#5c5c5c]">No submissions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex gap-2 items-center justify-between text-xs text-[#5c5c5c]">
          <span>{data.total} total · Page {data.page} of {data.pages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-[#e5e5e5] disabled:opacity-40 hover:bg-[#fafaf9]">←</button>
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-[#e5e5e5] disabled:opacity-40 hover:bg-[#fafaf9]">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
