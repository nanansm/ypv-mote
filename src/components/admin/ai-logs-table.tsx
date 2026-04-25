"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type AiLog = {
  id: number;
  submissionId: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  content: string;
  createdAt: string;
};

type Response = { rows: AiLog[]; total: number; page: number };

export function AiLogsTable() {
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/logs/ai?page=${page}`);
    setData(await res.json() as Response);
    setLoading(false);
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <Link href="/admin/logs" className="inline-block text-sm text-[#5c5c5c] hover:text-[#1a1a1a]">← Logs</Link>
      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              {["Submission", "Model", "Tokens (p/c)", "Time", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-[#5c5c5c]">Loading…</td></tr>}
            {!loading && data?.rows.map((r) => (
              <>
                <tr key={r.id} className="border-b border-[#f0f0f0] hover:bg-[#fafaf9]">
                  <td className="px-4 py-2 font-mono">
                    <Link href={`/admin/submissions/${r.submissionId}`} className="text-[#3c3489] hover:underline">
                      {r.submissionId.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-4 py-2">{r.model}</td>
                  <td className="px-4 py-2">{r.promptTokens ?? "—"} / {r.completionTokens ?? "—"}</td>
                  <td className="px-4 py-2 text-[#5c5c5c]">{r.createdAt.replace("T", " ").slice(0, 19)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="text-[#3c3489] hover:underline">
                      {expanded === r.id ? "Collapse" : "View"}
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-content`} className="border-b border-[#f0f0f0]">
                    <td colSpan={5} className="px-4 py-3">
                      <pre className="text-xs text-[#1a1a1a] whitespace-pre-wrap font-sans bg-[#fafaf9] rounded p-3 max-h-64 overflow-y-auto">{r.content}</pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {!loading && data?.rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[#5c5c5c]">No AI analyses yet</td></tr>
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
