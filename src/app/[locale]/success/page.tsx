import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/db";
import { submissions, legalPages, legalPageTranslations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getWiseConfig, getWebinarConfig, getAdminNotificationEmail } from "@/lib/config";
import { wisePersonalProvider } from "@/lib/payment/wise-personal";
import Link from "next/link";

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function renderMarkdownToHtml(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-[#1a1a1a] mt-4 mb-1">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-[#1a1a1a] mt-3 mb-1">$3</h3>')
    .split(/\n\n+/)
    .map((block) => {
      if (block.startsWith("<h")) return block;
      return `<p class="text-sm text-[#5c5c5c] leading-relaxed">${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "success" });

  const submission = id
    ? db.select().from(submissions).where(eq(submissions.id, id)).get()
    : null;

  const [wise, webinar, adminEmail] = await Promise.all([
    wisePersonalProvider.getPaymentDetails(),
    getWebinarConfig(),
    getAdminNotificationEmail(),
  ]);

  const name = submission?.fullName ?? "";
  const email = submission?.email ?? "";

  // Load DB page content (fallback to i18n strings if not seeded)
  const page = db.select().from(legalPages).where(eq(legalPages.slug, "success-page")).get();
  const dbTranslation = page
    ? db.select().from(legalPageTranslations)
        .where(eq(legalPageTranslations.pageId, page.id))
        .all()
        .find((t) => t.locale === locale) ??
      db.select().from(legalPageTranslations)
        .where(eq(legalPageTranslations.pageId, page.id))
        .all()
        .find((t) => t.locale === "en")
    : null;

  const wiseDetailsBlock = [
    `Account holder: ${wise.accountHolder || "[Not configured]"}`,
    `Account number: ${wise.accountNumber || "[Not configured]"}`,
    `SWIFT/BIC: ${wise.swiftBic || "[Not configured]"}`,
    `Bank name: ${wise.bankName || "Wise"}`,
    `Bank address: ${wise.bankAddress || "[Not configured]"}`,
  ].join("\n");

  const placeholders: Record<string, string> = {
    name,
    email,
    wise_details_block: wiseDetailsBlock,
    wise_reference_instruction: wise.referenceInstruction,
    webinar_price: webinar.price || "TBD",
    webinar_date: webinar.date || "TBD",
    admin_email: adminEmail,
  };

  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Success badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-5 h-5 rounded-full bg-[#0f6e56] flex items-center justify-center">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-medium text-[#0f6e56]">Eligibility confirmed</span>
        </div>

        <h1
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-3xl text-[#1a1a1a] mb-2"
        >
          {t("title")}
        </h1>
        <p className="text-[#5c5c5c] mb-8">{t("subtitle")}</p>

        <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 sm:p-8">
          {dbTranslation ? (
            // DB-driven content with placeholder substitution
            <div
              className="space-y-3"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownToHtml(substitute(dbTranslation.bodyMarkdown, placeholders)),
              }}
            />
          ) : (
            // Fallback: structured layout from i18n
            <div className="space-y-6">
              {name && <p className="text-[#1a1a1a]">{t("greeting", { name })}</p>}
              <p className="text-[#5c5c5c] text-sm">{t("eligible_message")}</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-xs text-[#5c5c5c] mb-0.5">{t("price_label")}</p>
                  <p className="font-semibold text-[#1a1a1a]">{webinar.price || "TBD"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#5c5c5c] mb-0.5">{t("date_label")}</p>
                  <p className="font-semibold text-[#1a1a1a]">{webinar.date || "TBD"}</p>
                </div>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#1a1a1a] mb-3">{t("payment_title")}</h2>
                <p className="text-sm text-[#5c5c5c] mb-4">{t("payment_intro")}</p>
                <div className="bg-[#fafaf9] border border-[#e5e5e5] rounded-md p-4 space-y-2">
                  {[
                    { label: "Account holder", value: wise.accountHolder },
                    { label: "Account number", value: wise.accountNumber },
                    { label: "SWIFT / BIC", value: wise.swiftBic },
                    { label: "Bank name", value: wise.bankName },
                    { label: "Bank address", value: wise.bankAddress },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4 text-sm">
                      <span className="text-[#5c5c5c] flex-shrink-0">{label}</span>
                      <span className="text-[#1a1a1a] font-medium text-right">
                        {value || <span className="text-[#5c5c5c] italic">Not configured</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#5c5c5c]">
                  <span className="font-medium">{t("reference_label")}:</span>{" "}
                  {wise.referenceInstruction}
                </p>
              </div>
              <div className="border-t border-[#e5e5e5] pt-5">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-2">{t("next_steps_title")}</h3>
                <p className="text-sm text-[#5c5c5c]">{t("next_steps")}</p>
              </div>
              {email && <p className="text-xs text-[#5c5c5c]">{t("check_email", { email })}</p>}
              {adminEmail && <p className="text-xs text-[#5c5c5c]">{t("contact", { email: adminEmail })}</p>}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href={`/${locale}`} className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors">
            ← Return to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
