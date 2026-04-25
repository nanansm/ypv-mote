"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Template = {
  id: number;
  key: string;
  subject: string;
  updatedAt: string | null;
};

export function EmailTemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/emails")
      .then((r) => r.json())
      .then((d: Template[]) => { setTemplates(d); setLoading(false); });
  }, []);

  if (loading) return <p className="text-sm text-[#5c5c5c]">Loading…</p>;

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden max-w-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
            <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">Slug</th>
            <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">Subject</th>
            <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">Updated</th>
            <th className="px-4 py-2.5 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-b border-[#f0f0f0] hover:bg-[#fafaf9]">
              <td className="px-4 py-2.5 font-mono text-xs">{t.key}</td>
              <td className="px-4 py-2.5 text-[#1a1a1a]">{t.subject}</td>
              <td className="px-4 py-2.5 text-xs text-[#5c5c5c]">{t.updatedAt?.split("T")[0] ?? "—"}</td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/emails/${t.id}`} className="text-[#3c3489] hover:underline text-xs">Edit</Link>
              </td>
            </tr>
          ))}
          {templates.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-[#5c5c5c]">No templates found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
