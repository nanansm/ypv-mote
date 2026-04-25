"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Question = {
  id: number;
  key: string;
  type: string;
  section: number;
  order: number;
  required: number;
  isEligibilityGate: number;
  translations: Array<{ locale: string; label: string }>;
};

export function QuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/questions")
      .then((r) => r.json())
      .then((d: Question[]) => { setQuestions(d); setLoading(false); });
  }, []);

  async function moveOrder(id: number, direction: "up" | "down") {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= questions.length) return;

    const updated = [...questions];
    const aOrder = updated[idx].order;
    const bOrder = updated[target].order;
    updated[idx] = { ...updated[idx], order: bOrder };
    updated[target] = { ...updated[target], order: aOrder };

    // Swap in place
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setQuestions(updated);

    await Promise.all([
      fetch(`/api/admin/questions/${questions[idx].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: bOrder }) }),
      fetch(`/api/admin/questions/${questions[target].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: aOrder }) }),
    ]);
  }

  const sections = [1, 2, 3] as const;

  if (loading) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <div key={s} className="bg-white border border-[#e5e5e5] rounded-lg">
          <div className="px-4 py-3 border-b border-[#e5e5e5] bg-[#fafaf9]">
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Section {s}</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[540px]">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="px-4 py-2 text-left text-[#5c5c5c] font-medium w-10">Order</th>
                <th className="px-4 py-2 text-left text-[#5c5c5c] font-medium">Key</th>
                <th className="px-4 py-2 text-left text-[#5c5c5c] font-medium">Type</th>
                <th className="px-4 py-2 text-left text-[#5c5c5c] font-medium">Label (EN)</th>
                <th className="px-4 py-2 text-left text-[#5c5c5c] font-medium">Req</th>
                <th className="px-4 py-2 text-left text-[#5c5c5c] font-medium">Gate</th>
                <th className="px-4 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {questions
                .filter((q) => q.section === s)
                .sort((a, b) => a.order - b.order)
                .map((q, i, arr) => (
                  <tr key={q.id} className="border-b border-[#f0f0f0] hover:bg-[#fafaf9]">
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5">
                        <button disabled={i === 0} onClick={() => moveOrder(q.id, "up")} className="text-[#5c5c5c] disabled:opacity-30 hover:text-[#1a1a1a] leading-none">▲</button>
                        <button disabled={i === arr.length - 1} onClick={() => moveOrder(q.id, "down")} className="text-[#5c5c5c] disabled:opacity-30 hover:text-[#1a1a1a] leading-none">▼</button>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono">{q.key}</td>
                    <td className="px-4 py-2">{q.type}</td>
                    <td className="px-4 py-2">{q.translations.find((t) => t.locale === "en")?.label ?? "—"}</td>
                    <td className="px-4 py-2">{q.required ? "✓" : "—"}</td>
                    <td className="px-4 py-2">{q.isEligibilityGate ? "✓" : "—"}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/questions/${q.id}`} className="text-[#3c3489] hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Link href="/admin/questions/new" className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770] transition-colors">
          + New question
        </Link>
      </div>
    </div>
  );
}
