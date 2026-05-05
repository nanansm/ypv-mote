import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/db";
import { submissions, legalPages, legalPageTranslations } from "@/db/schema";

const SEM_URL =
  "https://www.sem.admin.ch/sem/en/home/themen/arbeit/berufspraktikum.html";

function renderEligibleMarkdown(md: string): string {
  const processed = md
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-xl font-semibold text-[#1a1a1a] mt-4 mb-2">$1</h2>'
    )
    .replace(/^---$/gm, '<hr class="border-[#e5e5e5] my-4"/>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#3c3489] underline-offset-2 hover:underline">$1</a>'
    );

  return processed
    .split(/\n\n+/)
    .map((block) => {
      if (block.startsWith("<h") || block.startsWith("<hr")) return block;
      return `<p class="text-[15px] leading-relaxed text-[#5c5c5c]">${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default async function EligiblePage({
  searchParams,
}: {
  searchParams: Promise<{ submission_id?: string }>;
}) {
  const { submission_id } = await searchParams;
  const locale = await getLocale();

  if (!submission_id) {
    redirect(`/${locale}`);
  }

  const submission = db
    .select()
    .from(submissions)
    .where(eq(submissions.id, submission_id))
    .get();

  if (!submission) {
    redirect(`/${locale}`);
  }

  if (submission.eligibilityStatus !== "passed") {
    redirect(`/${locale}/rejected`);
  }

  const t = await getTranslations({ locale, namespace: "eligible" });
  const name = submission.fullName?.trim() || "";

  const page = db
    .select()
    .from(legalPages)
    .where(eq(legalPages.slug, "eligible-page"))
    .get();

  const dbTranslation = page
    ? (db
        .select()
        .from(legalPageTranslations)
        .where(eq(legalPageTranslations.pageId, page.id))
        .all()
        .find((r) => r.locale === locale) ??
      db
        .select()
        .from(legalPageTranslations)
        .where(eq(legalPageTranslations.pageId, page.id))
        .all()
        .find((r) => r.locale === "en"))
    : null;

  return (
    <div className="bg-[#fafaf9] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!dbTranslation && (
          <h1
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            className="text-3xl sm:text-4xl text-[#1a1a1a] mb-4 sm:mb-6"
          >
            {t("congratulations", { name })}
          </h1>
        )}

        <div className="bg-white border border-[#e5e5e5] rounded-lg p-5 sm:p-8">
          {dbTranslation ? (
            <div
              className="space-y-2"
              dangerouslySetInnerHTML={{
                __html: renderEligibleMarkdown(
                  dbTranslation.bodyMarkdown.replace(/\{name\}/g, name)
                ),
              }}
            />
          ) : (
            <>
              <div className="space-y-4 text-[15px] leading-relaxed text-[#5c5c5c]">
                <p className="text-[#1a1a1a] font-medium">{t("lead")}</p>
                <p>{t("p1")}</p>
                <p>{t("p2")}</p>
                <p>{t("p3")}</p>
                <p>
                  {t.rich("p4", {
                    link: (chunks) => (
                      <a
                        href={SEM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3c3489] underline-offset-2 hover:underline"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
                <p>{t("p5")}</p>
                <p>{t("p6")}</p>
              </div>

              <div className="mt-6 sm:mt-8 bg-[#fafaf9] border-t border-[#e5e5e5] -mx-5 sm:-mx-8 px-5 sm:px-8 py-5 sm:py-6">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-[#8a8a8a] mb-3">
                  {t("disclaimer_label")}
                </p>
                <div className="space-y-3 text-[13px] leading-relaxed text-[#8a8a8a]">
                  <p>{t("disclaimer_p1")}</p>
                  <p>{t("disclaimer_p2")}</p>
                  <p>{t("disclaimer_p3")}</p>
                  <p>{t("disclaimer_p4")}</p>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 space-y-4 text-[15px] leading-relaxed text-[#5c5c5c]">
                <p>{t("outro")}</p>
                <p>{t("closing")}</p>
              </div>
            </>
          )}

          <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
            <Link
              href={`/${locale}`}
              className="flex-1 inline-flex items-center justify-center h-12 px-5 rounded-md border border-[#3c3489] text-sm font-medium text-[#3c3489] hover:bg-[#f0effe] transition-colors text-center"
            >
              {t("disagree")}
            </Link>
            <Link
              href={`/${locale}/sessions?submission_id=${submission_id}`}
              className="flex-1 inline-flex items-center justify-center h-12 px-5 rounded-md bg-[#3c3489] text-white text-sm font-medium hover:bg-[#2e2770] transition-colors text-center"
            >
              {t("agree")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
