import { db } from "@/db";
import {
  formQuestions,
  questionOptions,
  questionTranslations,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export type QuestionOption = {
  id: number;
  value: string;
  order: number;
  label: string;
};

export type Question = {
  id: number;
  key: string;
  type: string;
  section: number;
  order: number;
  required: boolean;
  isEligibilityGate: boolean;
  validationRule: unknown;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  options: QuestionOption[];
};

export async function getQuestionsForSection(locale: string, section: number): Promise<Question[]> {
  const questions = (await db
    .select()
    .from(formQuestions)
    .where(eq(formQuestions.section, section))
    .all())
    .sort((a, b) => a.order - b.order);

  const result: Question[] = [];
  for (const q of questions) {
    const translation = (await db
      .select()
      .from(questionTranslations)
      .where(eq(questionTranslations.questionId, q.id))
      .all())
      .find((t) => t.locale === locale);

    const optionRows = (await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, q.id))
      .all())
      .sort((a, b) => a.order - b.order);

    const opts = [];
    for (const opt of optionRows) {
      const optTrans = (await db
        .select()
        .from(questionTranslations)
        .where(eq(questionTranslations.optionId, opt.id))
        .all())
        .find((t) => t.locale === locale);
      opts.push({
        id: opt.id,
        value: opt.value,
        order: opt.order,
        label: optTrans?.label ?? opt.value,
      });
    }

    result.push({
      id: q.id,
      key: q.key,
      type: q.type,
      section: q.section,
      order: q.order,
      required: q.required === 1,
      isEligibilityGate: q.isEligibilityGate === 1,
      validationRule: q.validationRule ? JSON.parse(q.validationRule) : null,
      label: translation?.label ?? q.key,
      placeholder: translation?.placeholder ?? null,
      helpText: translation?.helpText ?? null,
      options: opts,
    });
  }
  return result;
}
