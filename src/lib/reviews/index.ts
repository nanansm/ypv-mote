import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { reviews, reviewRateLimits } from "@/db/schema";
import { and, count, desc, eq, type SQL } from "drizzle-orm";

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

export async function createReview(input: ReviewInput, ip: string | null): Promise<CreateResult> {
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

  const existing = await db.select().from(reviews).where(eq(reviews.email, email)).get();
  if (existing) {
    return {
      ok: false,
      code: "duplicate",
      message: "You've already submitted a review. Thank you!",
    };
  }

  const bypassRateLimit = process.env.DISABLE_REVIEW_RATE_LIMIT === "1";
  if (ip && !bypassRateLimit) {
    const limit = await db
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
  await db.insert(reviews)
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
    const limit = await db
      .select()
      .from(reviewRateLimits)
      .where(eq(reviewRateLimits.ip, ip))
      .get();
    if (limit) {
      await db.update(reviewRateLimits)
        .set({ lastSubmittedAt: now })
        .where(eq(reviewRateLimits.ip, ip))
        .run();
    } else {
      await db.insert(reviewRateLimits).values({ ip, lastSubmittedAt: now }).run();
    }
  }

  const inserted = await db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!inserted) {
    return { ok: false, code: "validation", message: "Failed to insert review." };
  }
  return { ok: true, review: toReview(inserted) };
}

/** What the public may see. The review form promises the email is never shown
 * publicly, so it must not leave the server on any public path. */
export type PublicReview = Omit<Review, "email" | "status">;

export function toPublicReview(r: Review): PublicReview {
  const { email: _email, status: _status, ...rest } = r;
  return rest;
}

export async function listApprovedReviews(limit = 6): Promise<PublicReview[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .all();
  return rows.map((r) => toPublicReview(toReview(r)));
}

export type ReviewStats = {
  total: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export async function getReviewStats(): Promise<ReviewStats> {
  const rows = await db
    .select({ rating: reviews.rating, count: count() })
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .groupBy(reviews.rating)
    .all();

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let weightedSum = 0;
  for (const row of rows) {
    const rating = Math.floor(row.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating as 1 | 2 | 3 | 4 | 5] = row.count;
      total += row.count;
      weightedSum += rating * row.count;
    }
  }
  const average = total > 0 ? Math.round((weightedSum / total) * 10) / 10 : 0;
  return { total, average, distribution };
}

export type PagedReviews = {
  reviews: PublicReview[];
  total: number;
  hasMore: boolean;
};

export async function listApprovedReviewsPaged(params: {
  page?: number;
  perPage?: number;
  rating?: number | null;
}): Promise<PagedReviews> {
  const rawPage = Math.floor(Number(params.page));
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawPerPage = Math.floor(Number(params.perPage));
  const perPage =
    Number.isFinite(rawPerPage) && rawPerPage > 0 ? Math.min(rawPerPage, 50) : 20;
  const rawRating = Math.floor(Number(params.rating));
  const rating =
    Number.isFinite(rawRating) && rawRating >= 1 && rawRating <= 5 ? rawRating : null;

  const conditions: SQL[] = [eq(reviews.status, "approved")];
  if (rating) conditions.push(eq(reviews.rating, rating));
  const where = and(...conditions);

  const totalRow = await db.select({ value: count() }).from(reviews).where(where).get();
  const total = totalRow?.value ?? 0;

  const offset = (page - 1) * perPage;
  const rows = await db
    .select()
    .from(reviews)
    .where(where)
    .orderBy(desc(reviews.createdAt))
    .limit(perPage)
    .offset(offset)
    .all();

  return {
    reviews: rows.map((r) => toPublicReview(toReview(r))),
    total,
    hasMore: offset + rows.length < total,
  };
}

export async function listReviews(filters: {
  status?: ReviewStatus | null;
  rating?: number | null;
  locale?: string | null;
}): Promise<Review[]> {
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(reviews.status, filters.status));
  if (filters.rating) conditions.push(eq(reviews.rating, filters.rating));
  if (filters.locale) conditions.push(eq(reviews.locale, filters.locale));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db
    .select()
    .from(reviews)
    .where(where)
    .orderBy(desc(reviews.createdAt))
    .all();
  return rows.map(toReview);
}

export async function countPendingReviews(): Promise<number> {
  const rows = await db.select().from(reviews).where(eq(reviews.status, "pending")).all();
  return rows.length;
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<Review | null> {
  const now = new Date().toISOString();
  await db.update(reviews).set({ status, updatedAt: now }).where(eq(reviews.id, id)).run();
  const row = await db.select().from(reviews).where(eq(reviews.id, id)).get();
  return row ? toReview(row) : null;
}

export async function deleteReview(id: string): Promise<boolean> {
  const row = await db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!row) return false;
  await db.delete(reviews).where(eq(reviews.id, id)).run();
  return true;
}
