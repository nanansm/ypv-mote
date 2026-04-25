"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type EmailLog = {
  id: number;
  submissionId: string | null;
  toEmail: string;
  templateKey: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

type Response = { rows: EmailLog[]; total: number; page: number };

export function EmailLogsTable() {
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(page) });
    if (status) sp.set("status", status);
    const res = await fetch(`/api/admin/logs/emails?${sp}`);
    setData(await res.json() as Response);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none">
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <Link href="/admin/logs" className="h-9 px-3 rounded-md border border-[#e5e5e5] text-sm flex items-center hover:bg-[#fafaf9]">← Logs</Link>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              {["To", "Template", "Status", "Error", "Time"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-[#5c5c5c]">Loading…</td></tr>}
            {!loading && data?.rows.map((r) => (
              <tr key={r.id} className="border-b border-[#f0f0f0] hover:bg-[#fafaf9]">
                <td className="px-4 py-2">{r.toEmail}</td>
                <td className="px-4 py-2">{r.templateKey}</td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.status === "sent" ? "bg-green-50 text-[#0f6e56]" : "bg-red-50 text-[#a32d2d]"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-[#a32d2d] max-w-xs truncate">{r.errorMessage ?? "—"}</td>
                <td className="px-4 py-2 text-[#5c5c5c]">{r.createdAt.replace("T", " ").slice(0, 19)}</td>
              </tr>
            ))}
            {!loading && data?.rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#5c5c5c]">No logs</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 50 && (
        <div className="flex gap-2 items-center text-xs text-[#5c5c5c]">
          <span>{data.total} total · Page {data.page}</span>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border border-[#e5e5e5] disabled:opacity-40 hover:bg-[#fafaf9]">←</button>
          <button onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border border-[#e5e5e5] hover:bg-[#fafaf9]">→</button>
        </div>
      )}
    </div>
  );
}
