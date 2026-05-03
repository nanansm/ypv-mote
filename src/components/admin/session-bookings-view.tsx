"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookingsTable } from "./bookings-table";
import { CapacityBadge } from "./capacity-badge";
import { formatSessionDate, statusBadgeClasses } from "./sessions-format";
import type { SessionRecord } from "./session-form";

export function SessionBookingsView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/sessions/${sessionId}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        return r.json() as Promise<{ session: SessionRecord }>;
      })
      .then((d) => {
        if (cancelled) return;
        if (d?.session) setSession(d.session);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return <div className="text-sm text-[#5c5c5c]">Loading…</div>;
  }

  if (notFound || !session) {
    return (
      <div>
        <Link
          href="/admin/sessions"
          className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a]"
        >
          ← Back to sessions
        </Link>
        <p className="text-sm text-[#a32d2d] mt-4">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sessions"
          className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a]"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">
          {formatSessionDate(session.date)}
        </h1>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadgeClasses(session.status)}`}
        >
          {session.status}
        </span>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 grid sm:grid-cols-4 gap-4">
        <Stat label="Time" value={`${session.time} local`} />
        <Stat
          label="Price"
          value={`$${session.priceUsd.toFixed(2)}`}
        />
        <Stat label="Duration" value={`${session.durationMinutes} min`} />
        <div>
          <p className="text-xs text-[#5c5c5c]">Capacity</p>
          <div className="mt-1">
            <CapacityBadge
              paid={session.paid_count}
              capacity={session.capacity}
            />
          </div>
        </div>
      </div>

      <BookingsTable sessionIdLock={sessionId} hideSessionColumn />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#5c5c5c]">{label}</p>
      <p className="text-sm text-[#1a1a1a] font-medium mt-1">{value}</p>
    </div>
  );
}
