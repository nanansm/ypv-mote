"use client";

import { useCallback, useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  locale: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  reviews: Review[];
  pendingCount: number;
};

const STATUS_BADGE: Record<Review["status"], string> = {
  pending: "text-[#996e00] bg-amber-50",
  approved: "text-[#0f6e56] bg-green-50",
  hidden: "text-[#5c5c5c] bg-[#f0f0f0]",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={n <= rating ? "#f59e0b" : "none"}
          stroke={n <= rating ? "#f59e0b" : "#d4d4d4"}
          strokeWidth="2"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsTable() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "approved" | "hidden" | "">(
    "pending"
  );
  const [rating, setRating] = useState<string>("");
  const [locale, setLocale] = useState<string>("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (rating) sp.set("rating", rating);
    if (locale) sp.set("locale", locale);
    const res = await fetch(`/api/admin/reviews?${sp}`);
    const data = (await res.json()) as ApiResponse;
    setReviews(data.reviews ?? []);
    setLoading(false);
  }, [status, rating, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(id: string, newStatus: Review["status"]) {
    setActionMsg(null);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setActionMsg(data.error ?? "Update failed");
      return;
    }
    setActionMsg(`Review ${newStatus}.`);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    setActionMsg(null);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setActionMsg(data.error ?? "Delete failed");
      return;
    }
    setActionMsg("Review deleted.");
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-[10px] text-[#5c5c5c] block mb-1 uppercase tracking-wide">
            Status
          </span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "" | "pending" | "approved" | "hidden")
            }
            className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] text-[#5c5c5c] block mb-1 uppercase tracking-wide">
            Rating
          </span>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none"
          >
            <option value="">All</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] text-[#5c5c5c] block mb-1 uppercase tracking-wide">
            Locale
          </span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="h-9 px-2 rounded-md border border-[#e5e5e5] text-sm focus:outline-none"
          >
            <option value="">All</option>
            <option value="en">EN</option>
            <option value="de">DE</option>
          </select>
        </label>
      </div>

      {actionMsg && (
        <p className="text-xs text-[#5c5c5c] bg-[#fafaf9] border border-[#e5e5e5] px-3 py-2 rounded">
          {actionMsg}
        </p>
      )}

      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafaf9]">
              <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">
                Status
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">
                Name
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">
                Rating
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">
                Comment
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">
                Locale
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">
                Created
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-[#5c5c5c]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#5c5c5c]">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#5c5c5c]">
                  No reviews match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              reviews.map((r, i) => {
                const isExpanded = expanded === r.id;
                const short =
                  r.comment.length > 90
                    ? `${r.comment.slice(0, 90).trimEnd()}…`
                    : r.comment;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-[#f0f0f0] hover:bg-[#fafaf9] ${
                      i % 2 === 1 ? "bg-[#fafaf9]/30" : ""
                    }`}
                  >
                    <td className="px-4 py-2 align-top">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="text-[#1a1a1a]">{r.name}</div>
                      <div className="text-[10px] text-[#5c5c5c]">{r.email}</div>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <Stars rating={r.rating} />
                    </td>
                    <td className="px-4 py-2 align-top max-w-md">
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                        className="text-left text-[#1a1a1a] hover:text-[#3c3489]"
                      >
                        {isExpanded ? r.comment : short}
                      </button>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#3c3489] bg-[#f0effe] uppercase">
                        {r.locale}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top text-[#5c5c5c]">
                      {r.createdAt.split("T")[0]}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        {r.status !== "approved" && (
                          <button
                            onClick={() => update(r.id, "approved")}
                            className="px-2 py-1 text-[10px] rounded border border-[#0f6e56] text-[#0f6e56] hover:bg-green-50"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== "hidden" && (
                          <button
                            onClick={() => update(r.id, "hidden")}
                            className="px-2 py-1 text-[10px] rounded border border-[#5c5c5c] text-[#5c5c5c] hover:bg-[#fafaf9]"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() => remove(r.id)}
                          className="px-2 py-1 text-[10px] rounded border border-[#a32d2d] text-[#a32d2d] hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
