import { db } from "@/db";
import {
  emailTemplates,
  sessionBookings,
  submissions,
  webinarSessions,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/client";
import { renderTemplate } from "@/lib/email/templates";
import { getAdminNotificationEmail } from "@/lib/config";
import { logEmail } from "@/lib/logging";
import {
  resolvePaymentMethod,
  type ResolvedPayment,
} from "./payment-method";
import { renderTextBlock } from "@/lib/payment-methods/render";

function formatPaymentBlockForEmail(payment: ResolvedPayment): string {
  return renderTextBlock(payment.defaultMethod, {
    amountFormatted: payment.amountFormatted,
    locale: "en",
  });
}

function formatSessionDateForEmail(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function loadBookingContext(bookingId: string) {
  const booking = db
    .select()
    .from(sessionBookings)
    .where(eq(sessionBookings.id, bookingId))
    .get();
  if (!booking) return null;

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
  if (!session || !submission) return null;

  return { booking, session, submission };
}

export async function sendBookingConfirmation(bookingId: string): Promise<void> {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) {
    console.warn(
      `[email] sendBookingConfirmation: missing context for ${bookingId}`
    );
    return;
  }
  const { booking, session, submission } = ctx;
  if (!submission.email) return;

  const template = db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, "session_booking_confirmation"))
    .get();
  if (!template) {
    console.warn("[email] session_booking_confirmation template missing");
    return;
  }

  const payment = await resolvePaymentMethod(submission, session);
  const adminEmail = await getAdminNotificationEmail();

  if (!payment) {
    console.warn(
      `[email] sendBookingConfirmation: no payment methods configured for booking ${bookingId}`
    );
    return;
  }

  const detailsBlock = formatPaymentBlockForEmail(payment);
  const paymentMethodLabel = `${payment.defaultMethod.displayName} (${payment.currency})`;
  const sessionPrice =
    payment.currency.toUpperCase() === "USD"
      ? session.priceUsd.toFixed(2)
      : payment.amountFormatted;

  const vars: Record<string, string> = {
    name: submission.fullName ?? "",
    booking_reference: booking.bookingReference,
    session_date: formatSessionDateForEmail(session.date),
    session_time: session.time,
    session_duration: String(session.durationMinutes),
    session_price: sessionPrice,
    payment_method: paymentMethodLabel,
    payment_amount: payment.amountFormatted,
    wise_details_block: detailsBlock,
    payment_details_block: detailsBlock,
    admin_email: adminEmail,
  };

  try {
    await sendEmail({
      to: submission.email,
      subject: renderTemplate(template.subject, vars),
      text: renderTemplate(template.bodyText, vars),
    });
    db.update(submissions)
      .set({ emailSentAt: new Date().toISOString() })
      .where(eq(submissions.id, submission.id))
      .run();
    logEmail({
      submissionId: submission.id,
      templateKey: "session_booking_confirmation",
      toEmail: submission.email,
      status: "sent",
    });
  } catch (err) {
    logEmail({
      submissionId: submission.id,
      templateKey: "session_booking_confirmation",
      toEmail: submission.email,
      status: "failed",
      errorMessage: String(err),
    });
    throw err;
  }
}

export async function sendBookingZoomLink(bookingId: string): Promise<void> {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) {
    console.warn(`[email] sendBookingZoomLink: missing context for ${bookingId}`);
    return;
  }
  const { booking, session, submission } = ctx;
  if (!submission.email) return;

  const template = db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, "session_zoom_link"))
    .get();
  if (!template) {
    console.warn("[email] session_zoom_link template missing");
    return;
  }

  const adminEmail = await getAdminNotificationEmail();

  const vars: Record<string, string> = {
    name: submission.fullName ?? "",
    booking_reference: booking.bookingReference,
    session_date: formatSessionDateForEmail(session.date),
    session_time: session.time,
    session_duration: String(session.durationMinutes),
    zoom_link: session.zoomLink || "[Zoom link not configured]",
    admin_email: adminEmail,
  };

  try {
    await sendEmail({
      to: submission.email,
      subject: renderTemplate(template.subject, vars),
      text: renderTemplate(template.bodyText, vars),
    });
    logEmail({
      submissionId: submission.id,
      templateKey: "session_zoom_link",
      toEmail: submission.email,
      status: "sent",
    });
  } catch (err) {
    logEmail({
      submissionId: submission.id,
      templateKey: "session_zoom_link",
      toEmail: submission.email,
      status: "failed",
      errorMessage: String(err),
    });
    throw err;
  }
}
