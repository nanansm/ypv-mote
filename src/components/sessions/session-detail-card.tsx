"use client";

import { formatLongDate, type AvailableSession } from "./session-calendar";

type Labels = {
  seats_taken: string;
  seats_full: string;
  duration_minutes: (n: number) => string;
  book_button: (price: string) => string;
  book_full: string;
  booking: string;
};

type Props = {
  locale: string;
  session: AvailableSession | null;
  selectHint: string;
  labels: Labels;
  onBook: (session: AvailableSession) => void;
  isBooking: boolean;
  errorMessage: string | null;
  onClose?: () => void;
};

function fmtSeatsTaken(template: string, paid: number, capacity: number): string {
  return template
    .replace("{paid}", String(paid))
    .replace("{capacity}", String(capacity));
}

export function SessionDetailCard({
  locale,
  session,
  selectHint,
  labels,
  onBook,
  isBooking,
  errorMessage,
  onClose,
}: Props) {
  if (!session) {
    return (
      <div className="bg-white border border-dashed border-[#e5e5e5] rounded-lg p-6 text-sm text-[#5c5c5c] text-center">
        {selectHint}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 sm:p-6 space-y-4 relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sm:hidden absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#fafaf9] text-[#5c5c5c]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      <div>
        <p className="text-xs uppercase tracking-wider text-[#5c5c5c] mb-1">
          {locale === "de" ? "Datum" : "Date"}
        </p>
        <p className="text-base font-medium text-[#1a1a1a]">
          {formatLongDate(session.date, locale)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#f0f0f0]">
        <Stat
          label={locale === "de" ? "Uhrzeit" : "Time"}
          value={session.time}
        />
        <Stat
          label={locale === "de" ? "Dauer" : "Duration"}
          value={labels.duration_minutes(session.duration_minutes)}
        />
        <Stat
          label={locale === "de" ? "Preis" : "Price"}
          value={`$${session.price_usd.toFixed(2)}`}
        />
      </div>

      <div className="pt-3 border-t border-[#f0f0f0]">
        <p
          className={`text-sm font-medium ${
            session.is_full ? "text-[#a32d2d]" : "text-[#0f6e56]"
          }`}
        >
          {session.is_full
            ? labels.seats_full
            : fmtSeatsTaken(
                labels.seats_taken,
                session.paid_count,
                session.capacity
              )}
        </p>
      </div>

      {session.description && (
        <div className="pt-3 border-t border-[#f0f0f0]">
          <p className="text-sm text-[#5c5c5c] whitespace-pre-line">
            {session.description}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="text-xs text-[#a32d2d] bg-red-50 border border-red-100 px-3 py-2 rounded">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        disabled={session.is_full || isBooking}
        onClick={() => onBook(session)}
        className={`w-full h-12 rounded-md text-sm font-medium transition-colors ${
          session.is_full
            ? "bg-[#fafaf9] text-[#5c5c5c] cursor-not-allowed border border-[#e5e5e5]"
            : "bg-[#3c3489] text-white hover:bg-[#2e2770] disabled:opacity-60"
        }`}
      >
        {isBooking
          ? labels.booking
          : session.is_full
          ? labels.book_full
          : labels.book_button(session.price_usd.toFixed(2))}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#5c5c5c]">
        {label}
      </p>
      <p className="text-sm font-medium text-[#1a1a1a] mt-0.5">{value}</p>
    </div>
  );
}
