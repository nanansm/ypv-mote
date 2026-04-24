import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { db } from "@/db";
import { legalPages, legalPageTranslations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  const page = db.select().from(legalPages).where(eq(legalPages.slug, slug)).get();
  if (!page) notFound();

  const translation = db
    .select()
    .from(legalPageTranslations)
    .where(eq(legalPageTranslations.pageId, page.id))
    .all()
    .find((t) => t.locale === locale) ??
    db
      .select()
      .from(legalPageTranslations)
      .where(eq(legalPageTranslations.pageId, page.id))
      .all()
      .find((t) => t.locale === "en");

  if (!translation) notFound();

  // Simple markdown to HTML conversion (no heavy library)
  const html = simpleMarkdownToHtml(translation.bodyMarkdown);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="text-3xl text-[#1a1a1a] mb-2"
        >
          {translation.title}
        </h1>
        <p className="text-xs text-[#5c5c5c] mb-8">
          Last updated: {page.updatedAt.split("T")[0]}
        </p>
        <div
          className="prose-legal"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <style>{`
        .prose-legal h1 { display: none; }
        .prose-legal h2 { font-size: 1.125rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.5rem; color: #1a1a1a; }
        .prose-legal h3 { font-size: 1rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.25rem; color: #1a1a1a; }
        .prose-legal p { font-size: 0.875rem; color: #5c5c5c; margin-bottom: 0.75rem; line-height: 1.7; }
        .prose-legal ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .prose-legal li { font-size: 0.875rem; color: #5c5c5c; margin-bottom: 0.25rem; }
        .prose-legal strong { color: #1a1a1a; font-weight: 600; }
      `}</style>
    </div>
  );
}

function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, "\n\n")
    .split("\n\n")
    .map((block) => {
      if (block.startsWith("<h") || block.startsWith("<ul")) return block;
      return `<p>${block.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");
}
