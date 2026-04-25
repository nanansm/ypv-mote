import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/db";
import { legalPages, legalPageTranslations } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function renderMarkdownToHtml(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-[#1a1a1a] mt-4 mb-1">$1</h2>')
    .split(/\n\n+/)
    .map((block) => {
      if (block.startsWith("<h")) return block;
      return `<p class="text-sm text-[#1a1a1a] leading-relaxed">${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default async function RejectedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; details?: string }>;
}) {
  const { reason, details } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "rejection" });

  let parsedDetails: Record<string, unknown> = {};
  try {
    parsedDetails = details ? JSON.parse(decodeURIComponent(details)) : {};
  } catch {
    parsedDetails = {};
  }

  const country = String(parsedDetails.country ?? "");
  const age = String(parsedDetails.age ?? "");
  const min = String(parsedDetails.min ?? "");
  const max = String(parsedDetails.max ?? "");

  function getRejectionMessage(): string {
    switch (reason) {
      case "country_not_eligible": return t("country_not_eligible", { country });
      case "age_out_of_range": return t("age_out_of_range", { age, country, min, max });
      case "vocational_training_required": return t("vocational_training_required");
      case "field_interest_required": return t("field_interest_required");
      default: return t("country_not_eligible", { country: "" });
    }
  }

  // Load DB page content
  const page = db.select().from(legalPages).where(eq(legalPages.slug, "rejected-page")).get();
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

  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white border border-[#e5e5e5] rounded-lg p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#fafaf9] border border-[#e5e5e5] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="#5c5c5c" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="#5c5c5c" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                className="text-2xl text-[#1a1a1a] mb-1"
              >
                {t("title")}
              </h1>
              <p className="text-sm text-[#5c5c5c]">{t("subtitle")}</p>
            </div>
          </div>

          {dbTranslation ? (
            // DB-driven body with {rejection_reason} substituted
            <div
              className="space-y-3"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownToHtml(
                  substitute(dbTranslation.bodyMarkdown, { rejection_reason: getRejectionMessage() })
                ),
              }}
            />
          ) : (
            // Fallback: original structured layout
            <>
              <div className="border-l-2 border-[#e5e5e5] pl-4 mb-6">
                <p className="text-sm text-[#1a1a1a] leading-relaxed">{getRejectionMessage()}</p>
              </div>
              <p className="text-sm text-[#5c5c5c] mb-2">{t("encouragement")}</p>
              <p className="text-sm text-[#5c5c5c]">{t("contact")}</p>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-[#e5e5e5]">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center h-10 px-6 rounded-md border border-[#e5e5e5] text-sm font-medium text-[#1a1a1a] hover:bg-[#fafaf9] transition-colors"
            >
              {t("back")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
