"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CapacityBadge } from "./capacity-badge";
import { SessionForm, type SessionRecord } from "./session-form";
import { formatSessionDate, statusBadgeClasses } from "./sessions-format";

type ListResponse = { sessions: SessionRecord[] };

export function SessionsManager() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [editing, setEditing] = useState<SessionRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sessions");
    const json = (await res.json()) as ListResponse;
    setSessions(json.sessions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) set.add(s.date.slice(0, 7));
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (monthFilter && !s.date.startsWith(monthFilter)) return false;
      return true;
    });
  }, [sessions, statusFilter, monthFilter]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(s: SessionRecord) {
    setEditing(s);
    setOpen(true);
  }

  async function archive(s: SessionRecord) {
    setDeleteError(null);
    if (
      !confirm(
        `Archive session on ${formatSessionDate(s.date)}? This deletes the session record and is only allowed when there are no paid bookings.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/sessions/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setDeleteError(data.error ?? `Archive failed (${res.status})`);
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none"
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openNew}
          className="h-9 px-4 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770]"
        >
          + New Session
        </button>
      </div>

      {deleteError && (
        <div className="text-xs text-[#a32d2d] bg-red-50 px-3 py-2 rounded">
          {deleteError}
        </div>
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              {["Date", "Time", "Capacity", "Price", "Status", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[#5c5c5c]"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && sessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm text-[#5c5c5c] mb-3">
                    No sessions yet.
                  </p>
                  <button
                    onClick={openNew}
                    className="px-4 py-2 rounded-md bg-[#3c3489] text-white text-sm hover:bg-[#2e2770]"
                  >
                    Create your first session
                  </button>
                </td>
              </tr>
            )}
            {!loading &&
              filtered.length === 0 &&
              sessions.length > 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#5c5c5c]"
                  >
                    No sessions match these filters.
                  </td>
                </tr>
              )}
            {!loading &&
              filtered.map((s, i) => (
                <tr
                  key={s.id}
                  onClick={() => openEdit(s)}
                  className={`border-b border-[#f0f0f0] hover:bg-[#fafaf9] cursor-pointer ${
                    i % 2 === 1 ? "bg-[#fafaf9]/30" : ""
                  }`}
                >
                  <td className="px-4 py-2 text-[#1a1a1a]">
                    {formatSessionDate(s.date)}
                  </td>
                  <td className="px-4 py-2 text-[#1a1a1a]">
                    {s.time}{" "}
                    <span className="text-[10px] text-[#5c5c5c]">
                      local time
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <CapacityBadge
                      paid={s.paid_count}
                      capacity={s.capacity}
                    />
                  </td>
                  <td className="px-4 py-2 text-[#1a1a1a]">
                    ${s.priceUsd.toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadgeClasses(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="px-2 py-1 text-[10px] rounded border border-[#e5e5e5] hover:bg-[#fafaf9]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => archive(s)}
                        className="px-2 py-1 text-[10px] rounded border border-[#a32d2d] text-[#a32d2d] hover:bg-red-50"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <SessionForm
        open={open}
        onOpenChange={setOpen}
        session={editing}
        onSaved={load}
      />
    </div>
  );
}
