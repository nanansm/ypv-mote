"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  SessionCalendar,
  type AvailableSession,
} from "./session-calendar";
import { SessionDetailCard } from "./session-detail-card";

type Props = {
  locale: string;
  submissionId: string | null;
};

export function SessionsPicker({ locale, submissionId }: Props) {
  const t = useTranslations("sessions");
  const router = useRouter();
  const [sessions, setSessions] = useState<AvailableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/sessions/available", { cache: "no-store" });
    if (!res.ok) {
      setSessions([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { sessions: AvailableSession[] };
    setSessions(data.sessions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setBookError(null);
    setDrawerOpen(true);
  }

  async function handleBook(session: AvailableSession) {
    if (!submissionId) {
      setBookError(t("missing_submission"));
      return;
    }
    setIsBooking(true);
    setBookError(null);
    try {
      const res = await fetch("/api/sessions/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          session_id: session.id,
        }),
      });
      const data = (await res.json()) as {
        booking_id?: string;
        booking_reference?: string;
        error?: string;
      };
      if (!res.ok) {
        if (res.status === 403) {
          setBookError(t("submission_not_eligible"));
        } else if (res.status === 409 && data.booking_reference) {
          setBookError(t("already_booked"));
        } else {
          setBookError(data.error ?? t("book_error"));
        }
        await load();
        return;
      }
      if (data.booking_id) {
        router.push(`/${locale}/success?booking_id=${data.booking_id}`);
        return;
      }
      setBookError(t("book_error"));
    } catch {
      setBookError(t("book_error"));
    } finally {
      setIsBooking(false);
    }
  }

  if (!submissionId) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 text-sm text-[#a32d2d]">
        {t("missing_submission")}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 text-sm text-[#5c5c5c]">
        Loading…
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 text-sm text-[#5c5c5c] text-center">
        {t("no_sessions")}
      </div>
    );
  }

  function buildLabels(session: AvailableSession | null) {
    return {
      seats_taken: session
        ? t("seats_taken", {
            paid: session.paid_count,
            capacity: session.capacity,
          })
        : "",
      seats_full: t("seats_full"),
      duration_minutes: (n: number) => t("duration_minutes", { minutes: n }),
      book_button: (price: string) => t("book_button", { price }),
      book_full: t("book_full"),
      booking: t("booking"),
    };
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-4 lg:gap-6">
      <div>
        <SessionCalendar
          locale={locale}
          sessions={sessions}
          selectedSessionId={selectedId}
          onSelectSession={handleSelect}
          prevLabel={t("month_prev")}
          nextLabel={t("month_next")}
          weekdays={t("weekdays")}
        />
      </div>

      <div className="hidden lg:block">
        <SessionDetailCard
          locale={locale}
          session={selected}
          selectHint={t("select_date_hint")}
          labels={buildLabels(selected)}
          onBook={handleBook}
          isBooking={isBooking}
          errorMessage={bookError}
        />
      </div>

      {drawerOpen && selected && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto p-1">
            <SessionDetailCard
              locale={locale}
              session={selected}
              selectHint={t("select_date_hint")}
              labels={buildLabels(selected)}
              onBook={handleBook}
              isBooking={isBooking}
              errorMessage={bookError}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
