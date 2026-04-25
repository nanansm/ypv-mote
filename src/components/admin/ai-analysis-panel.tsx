"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

type Analysis = {
  id: number;
  model: string;
  response: string;
  createdAt: string;
};

export function AiAnalysisPanel({ submissionId }: { submissionId: string }) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  async function loadAnalyses() {
    const res = await fetch(`/api/admin/submissions/${submissionId}/analyze`);
    if (res.ok) {
      const data = await res.json() as Analysis[];
      setAnalyses(data);
      if (data.length > 0 && expanded === null) setExpanded(data[0].id);
    }
  }

  useEffect(() => { void loadAnalyses(); }, [submissionId]);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/submissions/${submissionId}/analyze`, { method: "POST" });
    const data = await res.json() as { analysis?: Analysis; error?: string };
    if (!res.ok || data.error) {
      setError(data.error ?? "Analysis failed");
    } else if (data.analysis) {
      setAnalyses((prev) => [data.analysis!, ...prev]);
      setExpanded(data.analysis.id);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold text-[#5c5c5c] uppercase tracking-wider">AI Analysis</h3>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-md bg-[#3c3489] text-white hover:bg-[#2e2770] disabled:opacity-60 transition-colors"
        >
          {loading ? "Analyzing…" : "Analyze with AI"}
        </button>
      </div>

      {error && <p className="text-xs text-[#a32d2d] mb-2">{error}</p>}

      {analyses.length === 0 && !loading && (
        <p className="text-xs text-[#5c5c5c]">No analyses yet. Click the button to run one.</p>
      )}

      {analyses.map((a) => (
        <div key={a.id} className="mb-2">
          <button
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            className="w-full text-left flex justify-between items-center py-1.5 text-xs text-[#5c5c5c] hover:text-[#1a1a1a]"
          >
            <span>{a.createdAt.split("T")[0]} — {a.model}</span>
            <span>{expanded === a.id ? "▾" : "▸"}</span>
          </button>
          {expanded === a.id && (
            <div className="prose-sm text-xs text-[#1a1a1a] border-t border-[#f0f0f0] pt-2 mt-1 [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:mt-2 [&_p]:mt-1 [&_ul]:pl-3 [&_li]:list-disc [&_strong]:font-semibold">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {a.response}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
