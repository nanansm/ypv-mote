import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  sessionBookings,
  submissions,
  webinarSessions,
} from "@/db/schema";
import { getAdminNotificationEmail } from "@/lib/config";
import { expirePendingBookings } from "@/lib/sessions";
import { resolvePaymentMethod } from "@/lib/sessions/payment-method";

function formatLongDate(iso: string, locale: string): string {
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

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string; id?: string }>;
}) {
  const { booking_id } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "success" });

  expirePendingBookings();

  if (!booking_id) {
    return <NotFoundView locale={locale} t={t} />;
  }

  const booking = db
    .select()
    .from(sessionBookings)
    .where(eq(sessionBookings.id, booking_id))
    .get();

  if (!booking) {
    return <NotFoundView locale={locale} t={t} />;
  }

  const session = db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.id, booking.sessionId))
    .get();

  const submission = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, booking.submissionId))
    .get();

  if (!session || !submission) {
    return <NotFoundView locale={locale} t={t} />;
  }

  const [payment, adminEmail] = await Promise.all([
    resolvePaymentMethod(submission, session),
    getAdminNotificationEmail(),
  ]);

  const name = submission.fullName ?? "";
  const email = submission.email ?? "";

  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-5 h-5 rounded-full bg-[#0f6e56] flex items-center justify-center">
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-sm font-medium text-[#0f6e56]">
            {locale === "de" ? "Buchung bestätigt" : "Booking confirmed"}
          </span>
        </div>

        <h1
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-3xl text-[#1a1a1a] mb-2"
        >
          {t("title")}
        </h1>
        <p className="text-sm text-[#5c5c5c] mb-6 sm:mb-8">{t("subtitle")}</p>

        <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 sm:p-8 space-y-6">
          {name && (
            <p className="text-sm text-[#1a1a1a]">{t("greeting", { name })}</p>
          )}
          <p className="text-sm text-[#5c5c5c]">{t("eligible_message")}</p>

          {/* Session detail */}
          <div>
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">
              {t("session_title")}
            </h2>
            <div className="bg-[#fafaf9] border border-[#e5e5e5] rounded-md p-4 space-y-2 text-sm">
              <Row
                label={t("date_label")}
                value={formatLongDate(session.date, locale)}
              />
              <Row label={t("time_label")} value={session.time} />
              <Row
                label={t("duration_label")}
                value={`${session.durationMinutes} ${locale === "de" ? "Minuten" : "minutes"}`}
              />
              <Row
                label={t("price_label")}
                value={payment.amountFormatted}
              />
            </div>
          </div>

          {/* Booking reference (prominent) */}
          <div>
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-2">
              {t("reference_title")}
            </h2>
            <div className="bg-[#f0effe] border border-[#3c3489] rounded-md p-4 text-center">
              <p className="font-mono text-lg sm:text-xl font-semibold text-[#3c3489] tracking-wider break-all">
                {booking.bookingReference}
              </p>
            </div>
            <p className="text-xs text-[#5c5c5c] mt-2">{t("reference_help")}</p>
          </div>

          {/* Payment method block (BCA or Wise — auto-detected) */}
          <div>
            <h2 className="text-base font-semibold text-[#1a1a1a] mb-1">
              {t("payment_title")}
            </h2>
            <p className="text-xs font-medium text-[#3c3489] mb-2">
              {payment.method === "bca"
                ? t("payment_method_bca")
                : t("payment_method_wise")}
            </p>
            {payment.method === "wise" && payment.fallbackNote && (
              <p className="text-xs text-[#996e00] bg-amber-50 border border-amber-100 rounded px-3 py-2 mb-3">
                {payment.fallbackNote === "idr_not_offered"
                  ? t("fallback_idr_not_offered")
                  : t("fallback_bca_not_configured")}
              </p>
            )}
            <p className="text-sm text-[#5c5c5c] mb-3">{t("payment_intro")}</p>
            <div className="bg-[#fafaf9] border border-[#e5e5e5] rounded-md p-4 space-y-2 text-sm">
              <Row
                label={t("amount_label")}
                value={payment.amountFormatted}
                emphasis
              />
              {payment.method === "bca" ? (
                <>
                  <Row
                    label={t("bca_account_holder")}
                    value={payment.account.holder}
                    fallback="Not configured"
                  />
                  <Row
                    label={t("bca_account_number")}
                    value={payment.account.number}
                    fallback="Not configured"
                  />
                  <Row
                    label={t("bca_bank_name")}
                    value={payment.account.bankName}
                  />
                  {payment.account.bankBranch && (
                    <Row
                      label={t("bca_bank_branch")}
                      value={payment.account.bankBranch}
                    />
                  )}
                </>
              ) : (
                <>
                  <Row
                    label={t("wise_account_holder")}
                    value={payment.account.holder}
                    fallback="Not configured"
                  />
                  <Row
                    label={t("wise_account_number")}
                    value={payment.account.number}
                    fallback="Not configured"
                  />
                  <Row
                    label={t("wise_swift_bic")}
                    value={payment.account.swiftBic}
                    fallback="Not configured"
                  />
                  <Row
                    label={t("wise_bank_name")}
                    value={payment.account.bankName || "Wise"}
                  />
                  <Row
                    label={t("wise_bank_address")}
                    value={payment.account.bankAddress}
                    fallback="Not configured"
                  />
                </>
              )}
              <div className="pt-2 mt-2 border-t border-[#e5e5e5]">
                <p className="text-xs text-[#5c5c5c] mb-1">
                  {t("reference_label")}
                </p>
                <p className="font-mono text-sm font-semibold text-[#1a1a1a] break-all">
                  {booking.bookingReference}
                </p>
              </div>
            </div>
          </div>

          {/* Expiry warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-[#996e00]">
            {t("expiry_warning")}
          </div>

          {/* What happens next */}
          <div className="border-t border-[#e5e5e5] pt-5">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">
              {t("next_steps_title")}
            </h3>
            <p className="text-sm text-[#5c5c5c]">{t("next_steps")}</p>
          </div>

          {email && (
            <p className="text-xs text-[#5c5c5c]">
              {t("check_email", { email })}
            </p>
          )}
          {adminEmail && (
            <p className="text-xs text-[#5c5c5c]">
              {t("contact", { email: adminEmail })}
            </p>
          )}
        </div>

        <div className="mt-6">
          <Link
            href={`/${locale}`}
            className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors"
          >
            ← {locale === "de" ? "Zurück zur Startseite" : "Return to homepage"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
  fallback,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  fallback?: string;
}) {
  const display = value
    ? value
    : fallback ?? "";
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#5c5c5c] flex-shrink-0">{label}</span>
      <span
        className={`text-right break-words ${
          emphasis
            ? "text-[#1a1a1a] font-semibold"
            : "text-[#1a1a1a] font-medium"
        } ${!value ? "text-[#5c5c5c] italic font-normal" : ""}`}
      >
        {display}
      </span>
    </div>
  );
}

function NotFoundView({
  locale,
  t,
}: {
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h1
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-2xl text-[#1a1a1a] mb-3"
        >
          {t("not_found_title")}
        </h1>
        <p className="text-sm text-[#5c5c5c] mb-6">{t("not_found_body")}</p>
        <Link
          href={`/${locale}/sessions`}
          className="inline-flex items-center h-11 px-5 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770]"
        >
          {t("back_to_sessions")}
        </Link>
      </div>
    </div>
  );
}
