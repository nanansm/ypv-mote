// Presentational review widgets. Deliberately free of any database import:
// these are pulled into Client Components, and reaching @/lib/reviews from here
// would drag @libsql/client into the browser bundle, where a `file:` URL throws.
export type ReviewStatsShape = {
  total: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

const SERIF_STYLE = { fontFamily: "'Instrument Serif', Georgia, serif" } as const;

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={n <= rating ? "#f59e0b" : "none"}
          stroke={n <= rating ? "#f59e0b" : "#d4d4d4"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/** Presentational average + total + per-star distribution bars. Reused by the
 * review listing page so the summary reads identically everywhere. */
export function ReviewsSummary({
  stats,
  averageLabel,
  countLabel,
}: {
  stats: ReviewStatsShape;
  averageLabel: string;
  countLabel: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
      <div className="shrink-0">
        <p style={SERIF_STYLE} className="text-3xl sm:text-4xl text-[#1a1a1a]">
          {averageLabel}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Stars rating={Math.round(stats.average)} />
          <span className="text-xs text-[#5c5c5c]">{countLabel}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 w-full max-w-sm space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((n) => {
          const starCount = stats.distribution[n];
          const pct = stats.total > 0 ? Math.round((starCount / stats.total) * 100) : 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs text-[#5c5c5c]">
              <span className="w-9 shrink-0">{n} ★</span>
              <div className="flex-1 min-w-0 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#f59e0b]" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right shrink-0">{starCount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
