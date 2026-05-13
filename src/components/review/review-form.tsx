"use client";

import { useState } from "react";

type Labels = {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailNote: string;
  ratingLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  errorGeneric: string;
  duplicate: string;
  validation: string;
  rateLimit: string;
  charsRemainingTemplate: string; // "{count} characters remaining"
};

type Props = {
  locale: string;
  labels: Labels;
};

export function ReviewForm({ locale, labels }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError(labels.validation);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rating, comment, locale }),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (data.code === "duplicate") setError(labels.duplicate);
      else if (data.code === "rate_limit") setError(labels.rateLimit);
      else setError(data.error ?? labels.errorGeneric);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 sm:p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#0f6e56] flex items-center justify-center mb-4">
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
            <path
              d="M1 7l4.5 4.5L15 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-2xl text-[#1a1a1a] mb-2"
        >
          {labels.successTitle}
        </h2>
        <p className="text-sm text-[#5c5c5c]">{labels.successBody}</p>
      </div>
    );
  }

  const remaining = 1000 - comment.length;
  const commentMin = comment.length >= 20;
  const ratingActive = hoverRating > 0 ? hoverRating : rating;

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-[#e5e5e5] rounded-lg p-5 sm:p-8 space-y-5"
    >
      <label className="block">
        <span className="text-sm font-medium text-[#1a1a1a] block mb-1.5">
          {labels.nameLabel}
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.namePlaceholder}
          className="w-full h-11 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-[#1a1a1a] block mb-1.5">
          {labels.emailLabel}
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.emailPlaceholder}
          className="w-full h-11 px-3 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
        />
        <span className="text-xs text-[#5c5c5c] block mt-1">{labels.emailNote}</span>
      </label>

      <div>
        <span className="text-sm font-medium text-[#1a1a1a] block mb-1.5">
          {labels.ratingLabel}
        </span>
        <div className="flex gap-1" role="radiogroup" aria-label={labels.ratingLabel}>
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= ratingActive;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#fafaf9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3c3489]"
              >
                <Star filled={filled} />
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-[#1a1a1a] block mb-1.5">
          {labels.commentLabel}
        </span>
        <textarea
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={labels.commentPlaceholder}
          rows={5}
          minLength={20}
          maxLength={1000}
          className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3c3489] resize-y"
        />
        <span
          className={`text-xs block mt-1 ${commentMin ? "text-[#5c5c5c]" : "text-[#996e00]"}`}
        >
          {labels.charsRemainingTemplate.replace("{count}", String(remaining))}
        </span>
      </label>

      {error && (
        <p className="text-sm text-[#a32d2d] bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] disabled:opacity-60 transition-colors"
      >
        {submitting ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? "#f59e0b" : "none"}
      stroke={filled ? "#f59e0b" : "#a0a0a0"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
