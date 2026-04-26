import { db } from "./index";
import { questionTranslations, legalPageTranslations } from "./schema";
import { eq, sql } from "drizzle-orm";

/**
 * One-shot, idempotent migration: locale "zh" -> "de".
 *
 * Strategy:
 *  - Detect if German content already exists. If yes, skip the wipe step so
 *    we don't clobber admin-edited German rows on a re-run.
 *  - Otherwise, delete every zh row from question_translations and
 *    legal_page_translations (those rows hold Chinese text and must NOT be
 *    auto-mapped to de). `npm run db:seed` then repopulates de rows from the
 *    authoritative German source.
 *  - For submissions, the locale column is a user preference, not content,
 *    so a straight UPDATE locale='zh' -> 'de' is always safe.
 *
 * Re-running this script after a successful migration is a no-op for the
 * content tables and keeps any admin-edited German rows intact.
 */
async function migrateLocale() {
  console.log("Migrating locale zh -> de...");

  const subUpdated = db.run(
    sql`UPDATE submissions SET locale = 'de' WHERE locale = 'zh'`
  );
  console.log(`submissions: updated ${subUpdated.changes ?? 0} rows zh->de`);

  const qtDeCount = db
    .select({ n: sql<number>`count(*)` })
    .from(questionTranslations)
    .where(eq(questionTranslations.locale, "de"))
    .get()?.n ?? 0;
  const lpDeCount = db
    .select({ n: sql<number>`count(*)` })
    .from(legalPageTranslations)
    .where(eq(legalPageTranslations.locale, "de"))
    .get()?.n ?? 0;

  if (qtDeCount > 0 || lpDeCount > 0) {
    console.log(
      `Skipping content wipe: de rows already present (question_translations=${qtDeCount}, legal_page_translations=${lpDeCount})`
    );
  } else {
    const qtZh = db.run(sql`DELETE FROM question_translations WHERE locale = 'zh'`);
    const lpZh = db.run(sql`DELETE FROM legal_page_translations WHERE locale = 'zh'`);
    console.log(
      `Cleared stale zh content rows: question_translations=${qtZh.changes ?? 0}, legal_page_translations=${lpZh.changes ?? 0}`
    );
  }

  console.log("Migrate-locale complete. Run `npm run db:seed` to repopulate German content if needed.");
}

migrateLocale().catch((err) => {
  console.error("Migrate-locale failed:", err);
  process.exit(1);
});
