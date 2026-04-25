import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/client";
import { getAdminNotificationEmail } from "@/lib/config";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const adminEmail = await getAdminNotificationEmail();
    if (!adminEmail) return NextResponse.json({ error: "admin.notification_email not set" }, { status: 400 });

    await sendEmail({
      to: adminEmail,
      subject: "YPV Admin — SMTP test",
      text: "If you received this, SMTP is configured correctly.",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
