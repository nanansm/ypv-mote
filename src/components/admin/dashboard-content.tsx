"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type DashboardData = {
  stats: { total: number; passed: number; passRate: number; pendingPayment: number; confirmed: number };
  daily: Array<{ day: string; count: number }>;
  rejections: Array<{ key: string; count: number }>;
  recent: Array<Record<string, unknown>>;
};

const REJECTION_COLORS = ["#3c3489", "#5c5c5c", "#a32d2d", "#0f6e56"];
const REJECTION_LABELS: Record<string, string> = {
  country_not_eligible: "Country",
  age_out_of_range: "Age",
  vocational_training_required: "No Training",
  field_interest_required: "No Field Interest",
};

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData) => setData(d))
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  if (error) return <p className="text-sm text-[#a32d2d]">{error}</p>;
  if (!data) return <div className="text-sm text-[#5c5c5c]">Loading…</div>;

  const { stats, daily, rejections, recent } = data;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Submissions (30d)" value={stats.total} />
        <StatCard label="Pass Rate (30d)" value={`${stats.passRate}%`} />
        <StatCard label="Pending Payment" value={stats.pendingPayment} accent />
        <StatCard label="Confirmed" value={stats.confirmed} success />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily chart */}
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
          <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3">Submissions (last 30 days)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3c3489" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rejections chart */}
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
          <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3">Rejection Reasons</h2>
          {rejections.length === 0 ? (
            <p className="text-sm text-[#5c5c5c]">No rejections yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={rejections} dataKey="count" nameKey="key" cx="50%" cy="50%" outerRadius={70} label={false}>
                  {rejections.map((_, i) => (
                    <Cell key={i} fill={REJECTION_COLORS[i % REJECTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [String(v), REJECTION_LABELS[String(name ?? "")] ?? String(name ?? "")]} />
                <Legend formatter={(name: string) => REJECTION_LABELS[name] ?? name} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent submissions */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] flex justify-between items-center">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Recent Submissions</h2>
          <Link href="/admin/submissions" className="text-xs text-[#3c3489] hover:underline">View all →</Link>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              {["Name", "Email", "Country", "Status", "Payment", "Date"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-[#5c5c5c]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr
                key={String(r.id)}
                className={`border-b border-[#f0f0f0] hover:bg-[#fafaf9] cursor-pointer ${i % 2 === 1 ? "bg-[#fafaf9]/50" : ""}`}
                onClick={() => window.location.href = `/admin/submissions/${r.id}`}
              >
                <td className="px-4 py-2">{String(r.full_name ?? r.fullName ?? "—")}</td>
                <td className="px-4 py-2">{String(r.email ?? "—")}</td>
                <td className="px-4 py-2">{String(r.country ?? "—")}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={String(r.eligibility_status ?? r.eligibilityStatus ?? "")} />
                </td>
                <td className="px-4 py-2">{String(r.payment_status ?? r.paymentStatus ?? "—")}</td>
                <td className="px-4 py-2">{String(r.created_at ?? r.createdAt ?? "").split("T")[0]}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[#5c5c5c]">No submissions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, success }: { label: string; value: string | number; accent?: boolean; success?: boolean }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <p className="text-xs text-[#5c5c5c] mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? "text-[#3c3489]" : success ? "text-[#0f6e56]" : "text-[#1a1a1a]"}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "passed" ? "text-[#0f6e56] bg-green-50" : "text-[#a32d2d] bg-red-50";
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>{status}</span>;
}
