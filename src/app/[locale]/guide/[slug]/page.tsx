import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";
import { db } from "@/db";
import { legalPages, legalPageTranslations } from "@/db/schema";
import { eq } from "drizzle-orm";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1
      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
      className="text-2xl sm:text-3xl text-[#1a1a1a] mt-8 mb-3"
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
      className="text-xl sm:text-2xl text-[#1a1a1a] mt-8 mb-3"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-[#1a1a1a] mt-6 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] leading-relaxed text-[#5c5c5c] mb-4">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="text-[15px] leading-relaxed text-[#5c5c5c]">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="text-[#1a1a1a] font-semibold">{children}</strong>
  ),
  a: ({ href, children }) => {
    const isExternal = /^https?:\/\//.test(href ?? "");
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="text-[#3c3489] underline-offset-2 hover:underline font-medium"
      >
        {children}
      </a>
    );
  },
};

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: routeLocale, slug } = await params;
  // Layouts and pages render in parallel, so the layout's setRequestLocale
  // does not reliably land first — each page pins its own locale.
  setRequestLocale(routeLocale);
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "cv_guide" });

  const page = await db
    .select()
    .from(legalPages)
    .where(eq(legalPages.slug, slug))
    .get();
  if (!page) notFound();

  const translations = await db
    .select()
    .from(legalPageTranslations)
    .where(eq(legalPageTranslations.pageId, page.id))
    .all();

  const translation =
    translations.find((t2) => t2.locale === locale) ??
    translations.find((t2) => t2.locale === "en");

  if (!translation) notFound();

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href={`/${locale}`}
          className="text-sm text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors"
        >
          ← {t("back_home")}
        </Link>

        <h1
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-3xl sm:text-4xl text-[#1a1a1a] mt-4 mb-6"
        >
          {translation.title}
        </h1>

        <div className="cv-guide-prose">
          <ReactMarkdown
            rehypePlugins={[rehypeSanitize]}
            components={markdownComponents}
          >
            {translation.bodyMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
