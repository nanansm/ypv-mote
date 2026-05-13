import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { reviews, reviewRateLimits } from "@/db/schema";
import { and, desc, eq, type SQL } from "drizzle-orm";

export type ReviewStatus = "pending" | "approved" | "hidden";

export type Review = {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  locale: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

function toReview(r: typeof reviews.$inferSelect): Review {
  const status: ReviewStatus =
    r.status === "approved" || r.status === "hidden" ? r.status : "pending";
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    rating: r.rating,
    comment: r.comment,
    locale: r.locale,
    status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export type ReviewInput = {
  name: string;
  email: string;
  rating: number;
  comment: string;
  locale?: string;
};

export type CreateResult =
  | { ok: true; review: Review }
  | { ok: false; code: "duplicate" | "validation" | "rate_limit"; message: string };

const RATE_LIMIT_MS = 60 * 60 * 1000;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createReview(input: ReviewInput, ip: string | null): CreateResult {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const comment = (input.comment ?? "").trim();
  const rating = Math.floor(Number(input.rating));
  const locale = input.locale === "de" ? "de" : "en";

  if (!name || name.length < 2) {
    return { ok: false, code: "validation", message: "Name is required." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, code: "validation", message: "A valid email is required." };
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, code: "validation", message: "Rating must be between 1 and 5." };
  }
  if (comment.length < 20) {
    return {
      ok: false,
      code: "validation",
      message: "Comment must be at least 20 characters.",
    };
  }
  if (comment.length > 1000) {
    return {
      ok: false,
      code: "validation",
      message: "Comment must be 1000 characters or fewer.",
    };
  }

  const existing = db.select().from(reviews).where(eq(reviews.email, email)).get();
  if (existing) {
    return {
      ok: false,
      code: "duplicate",
      message: "You've already submitted a review. Thank you!",
    };
  }

  const bypassRateLimit = process.env.DISABLE_REVIEW_RATE_LIMIT === "1";
  if (ip && !bypassRateLimit) {
    const limit = db
      .select()
      .from(reviewRateLimits)
      .where(eq(reviewRateLimits.ip, ip))
      .get();
    if (limit) {
      const last = new Date(limit.lastSubmittedAt).getTime();
      if (Number.isFinite(last) && Date.now() - last < RATE_LIMIT_MS) {
        return {
          ok: false,
          code: "rate_limit",
          message: "Please wait an hour before submitting another review.",
        };
      }
    }
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  db.insert(reviews)
    .values({
      id,
      name,
      email,
      rating,
      comment,
      locale,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (ip && !bypassRateLimit) {
    const limit = db
      .select()
      .from(reviewRateLimits)
      .where(eq(reviewRateLimits.ip, ip))
      .get();
    if (limit) {
      db.update(reviewRateLimits)
        .set({ lastSubmittedAt: now })
        .where(eq(reviewRateLimits.ip, ip))
        .run();
    } else {
      db.insert(reviewRateLimits).values({ ip, lastSubmittedAt: now }).run();
    }
  }

  const inserted = db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!inserted) {
    return { ok: false, code: "validation", message: "Failed to insert review." };
  }
  return { ok: true, review: toReview(inserted) };
}

export function listApprovedReviews(limit = 6): Review[] {
  const rows = db
    .select()
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .all();
  return rows.map(toReview);
}

export function listReviews(filters: {
  status?: ReviewStatus | null;
  rating?: number | null;
  locale?: string | null;
}): Review[] {
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(reviews.status, filters.status));
  if (filters.rating) conditions.push(eq(reviews.rating, filters.rating));
  if (filters.locale) conditions.push(eq(reviews.locale, filters.locale));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = db
    .select()
    .from(reviews)
    .where(where)
    .orderBy(desc(reviews.createdAt))
    .all();
  return rows.map(toReview);
}

export function countPendingReviews(): number {
  const rows = db.select().from(reviews).where(eq(reviews.status, "pending")).all();
  return rows.length;
}

export function updateReviewStatus(id: string, status: ReviewStatus): Review | null {
  const now = new Date().toISOString();
  db.update(reviews).set({ status, updatedAt: now }).where(eq(reviews.id, id)).run();
  const row = db.select().from(reviews).where(eq(reviews.id, id)).get();
  return row ? toReview(row) : null;
}

export function deleteReview(id: string): boolean {
  const row = db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!row) return false;
  db.delete(reviews).where(eq(reviews.id, id)).run();
  return true;
}
