"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type LegalPage = {
  id: number;
  slug: string;
  updatedAt: string | null;
  translations: Array<{ locale: string; title: string }>;
};

export function LegalPagesList() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/legal")
      .then((r) => r.json())
      .then((d: LegalPage[]) => { setPages(d); setLoading(false); });
  }, []);

  if (loading) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden max-w-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
            <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">Slug</th>
            <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">Title (EN)</th>
            <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">Updated</th>
            <th className="px-4 py-2.5 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id} className="border-b border-[#f0f0f0] hover:bg-[#fafaf9]">
              <td className="px-4 py-2.5 font-mono text-xs">{p.slug}</td>
              <td className="px-4 py-2.5">{p.translations.find((t) => t.locale === "en")?.title ?? "—"}</td>
              <td className="px-4 py-2.5 text-xs text-[#5c5c5c]">{p.updatedAt?.split("T")[0] ?? "—"}</td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/legal/${p.slug}`} className="text-[#3c3489] hover:underline text-xs">Edit</Link>
              </td>
            </tr>
          ))}
          {pages.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-[#5c5c5c]">No legal pages</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
