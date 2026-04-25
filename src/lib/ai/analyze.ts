import { callGroq } from "./groq";

const SYSTEM_PROMPT = `You are an admissions advisor for a paid webinar about the Swiss Young Professional Visa program. An applicant has submitted a pre-screening form. Analyze their profile and provide:

1. **Eligibility summary** (2-3 sentences)
2. **Strengths** — why they're a good fit
3. **Concerns** — red flags or gaps
4. **Recommended next steps** for the admin

Keep under 300 words, professional, actionable, markdown format. English only.`;

export type SubmissionForAnalysis = {
  fullName: string | null;
  country: string | null;
  dateOfBirth: string | null;
  ageAtSubmission: number | null;
  eligibilityStatus: string;
  rejectionReasonKey: string | null;
  englishLevel: string | null;
  workedAbroad: number | null;
  hasPassport: string | null;
  professionalExperience: string | null;
  diplomaInEnglish: number | null;
  currentLocation: string | null;
  vocationalTrainingCompleted: number | null;
  interestedInField: number | null;
};

export function buildUserMessage(s: SubmissionForAnalysis): string {
  return `Applicant Profile:
- Name: ${s.fullName ?? "N/A"}
- Country: ${s.country ?? "N/A"}
- Date of birth: ${s.dateOfBirth ?? "N/A"} (age: ${s.ageAtSubmission ?? "N/A"})
- Eligibility: ${s.eligibilityStatus}${s.rejectionReasonKey ? ` (reason: ${s.rejectionReasonKey})` : ""}
- Vocational training completed: ${s.vocationalTrainingCompleted === 1 ? "Yes" : "No"}
- Interested in working in field of study: ${s.interestedInField === 1 ? "Yes" : "No"}
- English level: ${s.englishLevel ?? "N/A"}
- Worked abroad before: ${s.workedAbroad === 1 ? "Yes" : "No"}
- Has passport: ${s.hasPassport ?? "N/A"}
- Professional experience: ${s.professionalExperience ?? "N/A"}
- Diploma in English: ${s.diplomaInEnglish === 1 ? "Yes" : "No"}
- Current location: ${s.currentLocation ?? "N/A"}`;
}

export async function analyzeSubmission({
  apiKey,
  model,
  submission,
}: {
  apiKey: string;
  model: string;
  submission: SubmissionForAnalysis;
}): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  const userMessage = buildUserMessage(submission);
  const res = await callGroq({ apiKey, model, systemPrompt: SYSTEM_PROMPT, userMessage });
  return {
    content: res.choices[0]?.message.content ?? "",
    promptTokens: res.usage.prompt_tokens,
    completionTokens: res.usage.completion_tokens,
  };
}
