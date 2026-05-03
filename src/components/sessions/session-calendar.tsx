"use client";

import { useMemo, useState } from "react";

export type AvailableSession = {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
  price_usd: number;
  capacity: number;
  paid_count: number;
  is_full: boolean;
  description: string | null;
};

type Props = {
  locale: string;
  sessions: AvailableSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  prevLabel: string;
  nextLabel: string;
  weekdays: string;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function fmtIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(d: Date, locale: string): string {
  return d.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function SessionCalendar({
  sessions,
  selectedSessionId,
  onSelectSession,
  prevLabel,
  nextLabel,
  weekdays,
  locale,
}: Props) {
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const minMonth = startOfMonth(today);
  const maxMonth = addMonths(minMonth, 2);

  const [viewMonth, setViewMonth] = useState<Date>(minMonth);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, AvailableSession[]>();
    for (const s of sessions) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [sessions]);

  const canGoPrev = viewMonth > minMonth;
  const canGoNext = viewMonth < maxMonth;

  const firstDayWeekday = ((new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  ).getDay() + 6) % 7);
  const totalDays = daysInMonth(viewMonth);

  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < firstDayWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const iso = fmtIsoDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    cells.push({ day: d, iso });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdayLabels = weekdays.split(",");

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;
  const selectedDate = selectedSession?.date ?? null;

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => canGoPrev && setViewMonth(addMonths(viewMonth, -1))}
          disabled={!canGoPrev}
          aria-label={prevLabel}
          className="w-9 h-9 flex items-center justify-center rounded-md border border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#fafaf9] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M9 2 4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="text-base font-medium text-[#1a1a1a] capitalize">
          {monthLabel(viewMonth, locale)}
        </h2>
        <button
          type="button"
          onClick={() => canGoNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canGoNext}
          aria-label={nextLabel}
          className="w-9 h-9 flex items-center justify-center rounded-md border border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#fafaf9] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M5 2l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayLabels.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] font-medium text-[#5c5c5c] uppercase tracking-wider py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`pad-${i}`} className="aspect-square" />;
          }
          const sessionsForDay = sessionsByDate.get(cell.iso) ?? [];
          const hasSessions = sessionsForDay.length > 0;
          const isPast = cell.iso < fmtIsoDate(today);
          const isSelected = selectedDate === cell.iso;
          const allFull =
            hasSessions && sessionsForDay.every((s) => s.is_full);

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => {
                if (!hasSessions) return;
                onSelectSession(sessionsForDay[0].id);
              }}
              disabled={!hasSessions || isPast}
              aria-label={`${cell.iso}${hasSessions ? " — sessions available" : ""}`}
              aria-pressed={isSelected}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-sm transition-colors relative
                ${
                  isSelected
                    ? "bg-[#3c3489] text-white border-[#3c3489] border"
                    : hasSessions && !isPast
                    ? "border border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#f0effe] hover:border-[#3c3489]"
                    : "text-[#a0a0a0] border border-transparent cursor-not-allowed"
                }
              `}
            >
              <span>{cell.day}</span>
              {hasSessions && !isPast && (
                <span
                  className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? "bg-white"
                      : allFull
                      ? "bg-[#a32d2d]"
                      : "bg-[#3c3489]"
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function formatLongDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
