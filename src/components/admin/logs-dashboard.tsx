"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type LogStats = {
  emailsSent: number;
  emailsFailed: number;
  sheetsSynced: number;
  aiAnalysisCount: number;
};

export function LogsDashboard() {
  const [stats, setStats] = useState<LogStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((d: LogStats) => setStats(d));
  }, []);

  const cards = [
    { label: "Emails sent (24h)", value: stats?.emailsSent ?? "—", href: "/admin/logs/emails", accent: false },
    { label: "Emails failed (24h)", value: stats?.emailsFailed ?? "—", href: "/admin/logs/emails?status=failed", accent: (stats?.emailsFailed ?? 0) > 0 },
    { label: "Sheets synced (24h)", value: stats?.sheetsSynced ?? "—", href: "/admin/logs/sheets", accent: false },
    { label: "AI analyses (24h)", value: stats?.aiAnalysisCount ?? "—", href: "/admin/logs/ai", accent: false },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}
            className="bg-white border border-[#e5e5e5] rounded-lg p-4 hover:border-[#3c3489] transition-colors block">
            <p className="text-xs text-[#5c5c5c] mb-1">{c.label}</p>
            <p className={`text-2xl font-semibold ${c.accent ? "text-[#a32d2d]" : "text-[#1a1a1a]"}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <LogLink href="/admin/logs/emails" icon="✉" title="Email Logs" desc="View all email send attempts and failures" />
        <LogLink href="/admin/logs/sheets" icon="⊞" title="Sheets Sync Logs" desc="Google Sheets sync history and errors" />
        <LogLink href="/admin/logs/ai" icon="◎" title="AI Analysis Logs" desc="Groq AI analyses, tokens used, and content" />
      </div>
    </div>
  );
}

function LogLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="bg-white border border-[#e5e5e5] rounded-lg p-4 hover:border-[#3c3489] transition-colors block">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-semibold text-[#1a1a1a]">{title}</h2>
      </div>
      <p className="text-xs text-[#5c5c5c]">{desc}</p>
    </Link>
  );
}
