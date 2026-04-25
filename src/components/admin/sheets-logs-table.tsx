"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type SyncLog = {
  id: number;
  submissionId: string | null;
  status: string;
  action: string | null;
  errorMessage: string | null;
  createdAt: string;
};

type Response = { rows: SyncLog[]; total: number; page: number };

export function SheetsLogsTable() {
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/logs/sheets?page=${page}`);
    setData(await res.json() as Response);
    setLoading(false);
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <Link href="/admin/logs" className="inline-block text-sm text-[#5c5c5c] hover:text-[#1a1a1a]">← Logs</Link>
      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              {["Submission", "Action", "Status", "Error", "Time"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-[#5c5c5c]">Loading…</td></tr>}
            {!loading && data?.rows.map((r) => (
              <tr key={r.id} className="border-b border-[#f0f0f0] hover:bg-[#fafaf9]">
                <td className="px-4 py-2 font-mono">
                  {r.submissionId
                    ? <Link href={`/admin/submissions/${r.submissionId}`} className="text-[#3c3489] hover:underline">{r.submissionId.slice(0, 8)}…</Link>
                    : "—"}
                </td>
                <td className="px-4 py-2">{r.action ?? "append"}</td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.status === "success" ? "bg-green-50 text-[#0f6e56]" : "bg-red-50 text-[#a32d2d]"}`}>
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
