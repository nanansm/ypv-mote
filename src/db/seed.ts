import { db } from "./index";
import {
  eligibilityConfig,
  formQuestions,
  questionOptions,
  questionTranslations,
  legalPages,
  legalPageTranslations,
  appSettings,
  emailTemplates,
} from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const now = new Date().toISOString();
  console.log("[seed] Seeding database...");

  // ─── Eligibility Config ────────────────────────────────────────────────────
  const existing = db
    .select()
    .from(eligibilityConfig)
    .where(eq(eligibilityConfig.id, 1))
    .get();

  if (!existing) {
    db.insert(eligibilityConfig)
      .values({
        id: 1,
        validCountries: JSON.stringify([
          "Argentina",
          "Australia",
          "Canada",
          "Chile",
          "Indonesia",
          "Japan",
          "Monaco",
          "New Zealand",
          "Philippines",
          "Russia",
          "San Marino",
          "South Africa",
          "Tunisia",
          "Ukraine",
          "USA",
        ]),
        defaultAgeMin: 18,
        defaultAgeMax: 35,
        countryAgeOverrides: JSON.stringify({
          Australia: { min: 20, max: 30 },
          "New Zealand": { min: 18, max: 30 },
          Russia: { min: 18, max: 30 },
        }),
        requireVocationalTraining: 1,
        requireFieldInterest: 1,
        updatedAt: now,
      })
      .run();
  }

  // ─── App Settings ──────────────────────────────────────────────────────────
  const settingRows = [
    { key: "webinar.name", value: "Young Professional Visa Switzerland - Pre Screening" },
    { key: "webinar.price", value: "USD 50" },
    { key: "webinar.date", value: "TBD" },
    { key: "webinar.zoom_link", value: "" },
    { key: "wise.account_holder", value: "" },
    { key: "wise.account_number", value: "" },
    { key: "wise.swift_bic", value: "" },
    { key: "wise.bank_name", value: "Wise" },
    { key: "wise.bank_address", value: "" },
    { key: "wise.reference_instruction", value: "Please include your full name in the transfer reference" },
    { key: "bca.account_holder", value: "" },
    { key: "bca.account_number", value: "" },
    { key: "bca.bank_name", value: "BCA" },
    { key: "bca.bank_branch", value: "" },
    { key: "smtp.host", value: "smtp.gmail.com" },
    { key: "smtp.port", value: "587" },
    { key: "smtp.user", value: "" },
    { key: "smtp.pass", value: "" },
    { key: "smtp.from_email", value: "" },
    { key: "smtp.from_name", value: "" },
    { key: "groq.api_key", value: "" },
    { key: "groq.model", value: "llama-3.3-70b-versatile" },
    { key: "sheets.service_account_json", value: "" },
    { key: "sheets.sheet_id", value: "" },
    { key: "sheets.tab_name", value: "Submissions" },
    { key: "admin.notification_email", value: "" },
  ];

  for (const s of settingRows) {
    const exists = db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, s.key))
      .get();
    if (!exists) {
      db.insert(appSettings).values({ ...s, updatedAt: now }).run();
    }
  }

  // ─── Form Questions ────────────────────────────────────────────────────────
  const questions = [
    // Section 1 — Contact
    {
      key: "full_name",
      type: "text",
      section: 1,
      order: 1,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "What is your full name?", placeholder: "John Smith", helpText: null },
      de: { label: "Wie lautet Ihr vollständiger Name?", placeholder: "Max Mustermann", helpText: null },
    },
    {
      key: "email",
      type: "email",
      section: 1,
      order: 2,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "Your email address", placeholder: "you@example.com", helpText: null },
      de: { label: "Ihre E-Mail-Adresse", placeholder: "sie@beispiel.com", helpText: null },
    },
    {
      key: "phone",
      type: "tel",
      section: 1,
      order: 3,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "Your phone number", placeholder: "+41 xxx xxx xx xx", helpText: null },
      de: { label: "Ihre Telefonnummer", placeholder: "+41 xxx xxx xx xx", helpText: null },
    },
    // Section 2 — Eligibility Gate
    {
      key: "country",
      type: "select",
      section: 2,
      order: 1,
      required: 1,
      isEligibilityGate: 1,
      validationRule: null,
      en: { label: "Which country's passport do you hold?", placeholder: "Select your country", helpText: null },
      de: { label: "Aus welchem Land ist Ihr Reisepass?", placeholder: "Land auswählen", helpText: null },
    },
    {
      key: "date_of_birth",
      type: "date",
      section: 2,
      order: 2,
      required: 1,
      isEligibilityGate: 1,
      validationRule: JSON.stringify({ minAge: 14, maxAge: 100 }),
      en: { label: "Date of birth", placeholder: "YYYY-MM-DD", helpText: null },
      de: { label: "Geburtsdatum", placeholder: "JJJJ-MM-TT", helpText: null },
    },
    {
      key: "vocational_training_completed",
      type: "radio",
      section: 2,
      order: 3,
      required: 1,
      isEligibilityGate: 1,
      validationRule: null,
      en: {
        label: "Have you completed vocational training or a university degree?",
        placeholder: null,
        helpText:
          "Apprenticeship, university of applied sciences, university, SMK (Indonesia). US/Canada students admitted; US apprentices with 2+ years in relevant occupation admitted.",
      },
      de: {
        label: "Haben Sie eine Berufsausbildung oder ein Hochschulstudium abgeschlossen?",
        placeholder: null,
        helpText:
          "Berufslehre, Fachhochschule, Universität, SMK (Indonesien). Studierende aus den USA/Kanada zugelassen; Lehrlinge aus den USA mit mindestens zwei Jahren Berufserfahrung im relevanten Beruf zugelassen.",
      },
    },
    {
      key: "interested_in_field",
      type: "radio",
      section: 2,
      order: 4,
      required: 1,
      isEligibilityGate: 1,
      validationRule: null,
      en: { label: "Are you interested in working in your field of study?", placeholder: null, helpText: null },
      de: { label: "Möchten Sie in Ihrem Studienfeld arbeiten?", placeholder: null, helpText: null },
    },
    // Section 3 — General Info
    {
      key: "english_level",
      type: "radio",
      section: 3,
      order: 1,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "What is your English proficiency level?", placeholder: null, helpText: null },
      de: { label: "Wie schätzen Sie Ihre Englischkenntnisse ein?", placeholder: null, helpText: null },
    },
    {
      key: "worked_abroad",
      type: "radio",
      section: 3,
      order: 2,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "Have you worked abroad before?", placeholder: null, helpText: null },
      de: { label: "Haben Sie bereits im Ausland gearbeitet?", placeholder: null, helpText: null },
    },
    {
      key: "has_passport",
      type: "radio",
      section: 3,
      order: 3,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "Do you currently have a valid passport?", placeholder: null, helpText: null },
      de: { label: "Verfügen Sie aktuell über einen gültigen Reisepass?", placeholder: null, helpText: null },
    },
    {
      key: "professional_experience",
      type: "radio",
      section: 3,
      order: 4,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "How much professional experience do you have?", placeholder: null, helpText: null },
      de: { label: "Wie viel Berufserfahrung haben Sie?", placeholder: null, helpText: null },
    },
    {
      key: "diploma_in_english",
      type: "radio",
      section: 3,
      order: 5,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "Is your diploma / degree certificate in English?", placeholder: null, helpText: null },
      de: { label: "Ist Ihr Diplom bzw. Ihre Studienurkunde auf Englisch ausgestellt?", placeholder: null, helpText: null },
    },
    {
      key: "current_location",
      type: "radio",
      section: 3,
      order: 6,
      required: 1,
      isEligibilityGate: 0,
      validationRule: null,
      en: { label: "Where are you currently located?", placeholder: null, helpText: null },
      de: { label: "Wo befinden Sie sich derzeit?", placeholder: null, helpText: null },
    },
  ];

  const questionOptions_data: Record<
    string,
    { value: string; order: number; en: string; de: string }[]
  > = {
    country: [
      { value: "Argentina", order: 1, en: "Argentina", de: "Argentinien" },
      { value: "Australia", order: 2, en: "Australia", de: "Australien" },
      { value: "Canada", order: 3, en: "Canada", de: "Kanada" },
      { value: "Chile", order: 4, en: "Chile", de: "Chile" },
      { value: "Indonesia", order: 5, en: "Indonesia", de: "Indonesien" },
      { value: "Japan", order: 6, en: "Japan", de: "Japan" },
      { value: "Monaco", order: 7, en: "Monaco", de: "Monaco" },
      { value: "New Zealand", order: 8, en: "New Zealand", de: "Neuseeland" },
      { value: "Philippines", order: 9, en: "Philippines", de: "Philippinen" },
      { value: "Russia", order: 10, en: "Russia", de: "Russland" },
      { value: "San Marino", order: 11, en: "San Marino", de: "San Marino" },
      { value: "South Africa", order: 12, en: "South Africa", de: "Südafrika" },
      { value: "Tunisia", order: 13, en: "Tunisia", de: "Tunesien" },
      { value: "Ukraine", order: 14, en: "Ukraine", de: "Ukraine" },
      { value: "USA", order: 15, en: "USA", de: "USA" },
      { value: "Others", order: 16, en: "Others", de: "Andere" },
    ],
    vocational_training_completed: [
      { value: "yes", order: 1, en: "Yes", de: "Ja" },
      { value: "no", order: 2, en: "No", de: "Nein" },
    ],
    interested_in_field: [
      { value: "yes", order: 1, en: "Yes", de: "Ja" },
      { value: "no", order: 2, en: "No", de: "Nein" },
    ],
    english_level: [
      { value: "beginner", order: 1, en: "Beginner (A1–A2)", de: "Anfänger (A1–A2)" },
      { value: "intermediate", order: 2, en: "Intermediate (B1–B2)", de: "Mittelstufe (B1–B2)" },
      { value: "advanced", order: 3, en: "Advanced (C1–C2)", de: "Fortgeschritten (C1–C2)" },
      { value: "none", order: 4, en: "I don't speak English", de: "Ich spreche kein Englisch" },
    ],
    worked_abroad: [
      { value: "yes", order: 1, en: "Yes", de: "Ja" },
      { value: "no", order: 2, en: "No", de: "Nein" },
    ],
    has_passport: [
      { value: "yes", order: 1, en: "Yes, I have a valid passport", de: "Ja, ich habe einen gültigen Reisepass" },
      { value: "no", order: 2, en: "No", de: "Nein" },
      { value: "plan_to_make", order: 3, en: "Not yet, but I plan to apply for one", de: "Noch nicht, aber ich plane, einen zu beantragen" },
    ],
    professional_experience: [
      { value: "fresh_graduate", order: 1, en: "Fresh graduate / no experience", de: "Berufseinsteiger:in / keine Erfahrung" },
      { value: "1_2_years", order: 2, en: "1–2 years", de: "1–2 Jahre" },
      { value: "2_3_years", order: 3, en: "2–3 years", de: "2–3 Jahre" },
      { value: "3_5_years", order: 4, en: "3–5 years", de: "3–5 Jahre" },
      { value: "5_plus_years", order: 5, en: "5+ years", de: "Mehr als 5 Jahre" },
    ],
    diploma_in_english: [
      { value: "yes", order: 1, en: "Yes", de: "Ja" },
      { value: "no", order: 2, en: "No", de: "Nein" },
    ],
    current_location: [
      { value: "own_country", order: 1, en: "In my home country", de: "In meinem Heimatland" },
      { value: "abroad", order: 2, en: "Abroad", de: "Im Ausland" },
    ],
  };

  for (const q of questions) {
    const existingQ = db
      .select()
      .from(formQuestions)
      .where(eq(formQuestions.key, q.key))
      .get();

    let qId: number;
    if (!existingQ) {
      const result = db
        .insert(formQuestions)
        .values({
          key: q.key,
          type: q.type,
          section: q.section,
          order: q.order,
          required: q.required,
          isEligibilityGate: q.isEligibilityGate,
          validationRule: q.validationRule,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: formQuestions.id })
        .get();
      qId = result.id;
    } else {
      qId = existingQ.id;
    }

    // Insert question translations
    for (const locale of ["en", "de"] as const) {
      const t = locale === "en" ? q.en : q.de;
      const existingT = db
        .select()
        .from(questionTranslations)
        .where(eq(questionTranslations.questionId, qId))
        .all()
        .find((r) => r.locale === locale);
      if (!existingT) {
        db.insert(questionTranslations)
          .values({
            questionId: qId,
            optionId: null,
            locale,
            label: t.label,
            placeholder: t.placeholder ?? null,
            helpText: t.helpText ?? null,
          })
          .run();
      }
    }

    // Insert options
    const opts = questionOptions_data[q.key] ?? [];
    for (const opt of opts) {
      const existingOpt = db
        .select()
        .from(questionOptions)
        .where(eq(questionOptions.questionId, qId))
        .all()
        .find((r) => r.value === opt.value);

      let optId: number;
      if (!existingOpt) {
        const result = db
          .insert(questionOptions)
          .values({ questionId: qId, value: opt.value, order: opt.order })
          .returning({ id: questionOptions.id })
          .get();
        optId = result.id;
      } else {
        optId = existingOpt.id;
      }

      // Option translations
      for (const locale of ["en", "de"] as const) {
        const label = locale === "en" ? opt.en : opt.de;
        const existingOT = db
          .select()
          .from(questionTranslations)
          .where(eq(questionTranslations.optionId, optId))
          .all()
          .find((r) => r.locale === locale);
        if (!existingOT) {
          db.insert(questionTranslations)
            .values({
              questionId: null,
              optionId: optId,
              locale,
              label,
              placeholder: null,
              helpText: null,
            })
            .run();
        }
      }
    }
  }

  // ─── Legal Pages ───────────────────────────────────────────────────────────
  const legalSlugs = ["privacy", "terms", "cookie", "refund", "disclaimer", "success-page", "rejected-page"] as const;
  type LegalSlug = typeof legalSlugs[number];

  const legalContent: Record<
    LegalSlug,
    { enTitle: string; deTitle: string; enBody: string; deBody: string }
  > = {
    privacy: {
      enTitle: "Privacy Policy",
      deTitle: "Datenschutzerklärung",
      enBody: `[REVIEW WITH LAWYER BEFORE PUBLISHING]

# Privacy Policy

*Last updated: [DATE]*

Young Professional Visa Switzerland Pre-Screening Form ("we", "our", "us") is committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable data protection law.

## 1. Data We Collect

When you complete the pre-screening form, we collect:
- Full name
- Email address
- Phone number
- Date of birth
- Passport country
- Educational and professional background information

## 2. How We Use Your Data

Your data is used solely to:
- Assess your eligibility for the Young Professional Visa Switzerland webinar
- Send you payment and webinar access instructions
- Maintain our records for legitimate business purposes

## 3. Data Storage

Your data is stored securely on our servers and, with your consent, in a Google Sheets spreadsheet accessible only to authorised administrators.

## 4. Data Retention

We retain your data for up to 24 months after submission. You may request deletion at any time by contacting us.

## 5. Your Rights

Under GDPR, you have the right to: access, rectify, erase, restrict, and port your data. To exercise these rights, contact us at the email below.

## 6. Contact

For data protection queries: [ADMIN EMAIL - TO BE CONFIGURED]`,

      deBody: `[VOR DER VERÖFFENTLICHUNG VON ANWALT PRÜFEN LASSEN]

# Datenschutzerklärung

*Zuletzt aktualisiert: [DATUM]*

Das Young Professional Visa Schweiz Vorprüfungsformular ("wir", "uns") setzt sich gemäss der Datenschutz-Grundverordnung (DSGVO) und dem geltenden Datenschutzrecht für den Schutz Ihrer personenbezogenen Daten ein.

## 1. Erhobene Daten

Wenn Sie das Vorprüfungsformular ausfüllen, erheben wir:
- Vollständiger Name
- E-Mail-Adresse
- Telefonnummer
- Geburtsdatum
- Land des Reisepasses
- Angaben zu Ausbildung und beruflichem Werdegang

## 2. Verwendung der Daten

Ihre Daten werden ausschliesslich verwendet, um:
- Ihre Eignung für das Young Professional Visa Schweiz Webinar zu prüfen
- Ihnen Zahlungs- und Zugangsanweisungen für das Webinar zu senden
- Unsere Aufzeichnungen für berechtigte geschäftliche Zwecke zu führen

## 3. Datenspeicherung

Ihre Daten werden sicher auf unseren Servern gespeichert und – mit Ihrer Einwilligung – in einer Google-Sheets-Tabelle, die nur autorisierten Administratoren zugänglich ist.

## 4. Speicherdauer

Wir bewahren Ihre Daten bis zu 24 Monate nach Einreichung auf. Sie können jederzeit eine Löschung verlangen.

## 5. Ihre Rechte

Gemäss DSGVO haben Sie das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung und Übertragung Ihrer Daten. Wenden Sie sich dafür an die untenstehende Adresse.

## 6. Kontakt

Anfragen zum Datenschutz: [ADMIN-E-MAIL – NOCH ZU KONFIGURIEREN]`,
    },
    terms: {
      enTitle: "Terms of Service",
      deTitle: "Nutzungsbedingungen",
      enBody: `[REVIEW WITH LAWYER BEFORE PUBLISHING]

# Terms of Service

*Last updated: [DATE]*

By submitting the pre-screening form and making payment, you agree to the following terms.

## 1. Service Description

We provide an informational webinar about the Young Professional Visa Switzerland program. This is an educational service only — we are not a visa agency and do not guarantee any visa outcome.

## 2. Eligibility Pre-Screening

Passing our pre-screening does not guarantee visa approval. Final eligibility is determined solely by the Swiss authorities.

## 3. Payment

Payment is required to access the webinar. See our Refund Policy for details on cancellations.

## 4. Conduct

Participants agree to engage respectfully during the webinar. We reserve the right to remove participants who engage in disruptive behaviour.

## 5. Intellectual Property

All webinar content is proprietary. Recording, reproduction, or distribution is prohibited without written consent.

## 6. Limitation of Liability

We are not liable for decisions made by immigration authorities. Information provided is for educational purposes only.

## 7. Governing Law

These terms are governed by Swiss law.`,

      deBody: `[VOR DER VERÖFFENTLICHUNG VON ANWALT PRÜFEN LASSEN]

# Nutzungsbedingungen

*Zuletzt aktualisiert: [DATUM]*

Mit dem Einreichen des Vorprüfungsformulars und der Zahlung stimmen Sie den folgenden Bedingungen zu.

## 1. Leistungsbeschreibung

Wir bieten ein informatives Webinar zum Young Professional Visa Schweiz Programm an. Es handelt sich ausschliesslich um eine Bildungsleistung — wir sind keine Visumsagentur und garantieren kein Visumsergebnis.

## 2. Eignungs-Vorprüfung

Das Bestehen unserer Vorprüfung garantiert keine Visumsbewilligung. Die endgültige Eignung wird ausschliesslich von den Schweizer Behörden festgelegt.

## 3. Zahlung

Für die Teilnahme am Webinar ist eine Zahlung erforderlich. Einzelheiten zu Stornierungen finden Sie in unserer Rückerstattungsrichtlinie.

## 4. Verhalten

Teilnehmende verpflichten sich zu einem respektvollen Umgang während des Webinars. Wir behalten uns vor, Teilnehmende mit störendem Verhalten zu entfernen.

## 5. Geistiges Eigentum

Alle Webinarinhalte sind urheberrechtlich geschützt. Aufnahmen, Vervielfältigungen oder Weitergaben sind ohne schriftliche Zustimmung untersagt.

## 6. Haftungsbeschränkung

Wir haften nicht für Entscheidungen der Migrationsbehörden. Die bereitgestellten Informationen dienen ausschliesslich Bildungszwecken.

## 7. Anwendbares Recht

Diese Bedingungen unterliegen dem Schweizer Recht.`,
    },
    cookie: {
      enTitle: "Cookie Policy",
      deTitle: "Cookie-Richtlinie",
      enBody: `[REVIEW WITH LAWYER BEFORE PUBLISHING]

# Cookie Policy

*Last updated: [DATE]*

## What Are Cookies

Cookies are small text files placed on your device when you visit our website.

## Cookies We Use

**Session cookies (essential):** We use a single session cookie to maintain your form progress and, in future, to support administrator login. This cookie is strictly necessary and cannot be disabled.

We do not use tracking cookies, advertising cookies, or third-party analytics cookies.

## Managing Cookies

You can disable cookies in your browser settings. Note that disabling session cookies will prevent the form from functioning correctly.

## Contact

For cookie-related queries: [ADMIN EMAIL - TO BE CONFIGURED]`,

      deBody: `[VOR DER VERÖFFENTLICHUNG VON ANWALT PRÜFEN LASSEN]

# Cookie-Richtlinie

*Zuletzt aktualisiert: [DATUM]*

## Was sind Cookies

Cookies sind kleine Textdateien, die beim Besuch unserer Website auf Ihrem Gerät gespeichert werden.

## Verwendete Cookies

**Sitzungs-Cookies (notwendig):** Wir verwenden ein einziges Sitzungs-Cookie, um Ihren Formularfortschritt zu speichern und künftig die Administrator-Anmeldung zu unterstützen. Dieses Cookie ist zwingend erforderlich und kann nicht deaktiviert werden.

Wir setzen keine Tracking-Cookies, Werbe-Cookies oder Analyse-Cookies von Dritten ein.

## Cookies verwalten

Sie können Cookies in den Einstellungen Ihres Browsers deaktivieren. Beachten Sie, dass das Deaktivieren der Sitzungs-Cookies den ordnungsgemässen Betrieb des Formulars verhindert.

## Kontakt

Anfragen zu Cookies: [ADMIN-E-MAIL – NOCH ZU KONFIGURIEREN]`,
    },
    refund: {
      enTitle: "Refund Policy",
      deTitle: "Rückerstattungsrichtlinie",
      enBody: `[REVIEW WITH LAWYER BEFORE PUBLISHING]

# Refund Policy

*Last updated: [DATE]*

## Eligibility for Refund

Full refunds are available if:
- You request a refund at least 48 hours before the scheduled webinar date
- The webinar is cancelled by us for any reason

## Non-Refundable Situations

We are unable to issue refunds if:
- The request is made less than 48 hours before the webinar
- You were unable to attend due to personal circumstances (internet issues, scheduling conflicts, etc.)
- You have already attended the webinar

## Process

To request a refund, contact us at [ADMIN EMAIL - TO BE CONFIGURED] with your submission ID and proof of payment. Refunds are processed within 7 business days.

## Currency & Fees

Refunds are issued in the original currency. Bank transfer fees are non-refundable.`,

      deBody: `[VOR DER VERÖFFENTLICHUNG VON ANWALT PRÜFEN LASSEN]

# Rückerstattungsrichtlinie

*Zuletzt aktualisiert: [DATUM]*

## Anspruch auf Rückerstattung

Eine vollständige Rückerstattung ist möglich, wenn:
- Sie die Rückerstattung mindestens 48 Stunden vor dem geplanten Webinardatum anfragen
- Das Webinar von uns aus irgendeinem Grund abgesagt wird

## Nicht erstattungsfähig

Wir können keine Rückerstattung gewähren, wenn:
- Die Anfrage weniger als 48 Stunden vor dem Webinar erfolgt
- Sie aus persönlichen Gründen nicht teilnehmen konnten (Internetprobleme, Terminkonflikte usw.)
- Sie das Webinar bereits besucht haben

## Ablauf

Senden Sie für eine Rückerstattung eine E-Mail an [ADMIN-E-MAIL – NOCH ZU KONFIGURIEREN] mit Ihrer Einreichungs-ID und einem Zahlungsnachweis. Rückerstattungen werden innerhalb von 7 Werktagen bearbeitet.

## Währung & Gebühren

Rückerstattungen erfolgen in der ursprünglichen Währung. Bankgebühren werden nicht erstattet.`,
    },
    "success-page": {
      enTitle: "Success Page",
      deTitle: "Erfolgsseite",
      enBody: `## Dear {name},

You have passed our initial eligibility check for the Young Professional Visa Switzerland webinar.

## Payment Instructions

To secure your place, please transfer the webinar fee to the following Wise account:

{wise_details_block}

**Transfer reference:** {wise_reference_instruction}

**Webinar date:** {webinar_date} · **Fee:** {webinar_price}

## What happens next?

Once your payment is verified by our team, you will receive the Zoom link to join the webinar. Please allow 1–2 business days for payment verification.

A confirmation email with these details has been sent to **{email}**.

For questions, reply to the confirmation email or contact us at {admin_email}.`,
      deBody: `## Liebe/r {name},

Sie haben unsere erste Eignungsprüfung für das Young Professional Visa Schweiz Webinar bestanden.

## Zahlungsanweisungen

Um Ihren Platz zu sichern, überweisen Sie bitte die Webinargebühr auf das folgende Wise-Konto:

{wise_details_block}

**Verwendungszweck:** {wise_reference_instruction}

**Webinardatum:** {webinar_date} · **Gebühr:** {webinar_price}

## Wie geht es weiter?

Sobald Ihre Zahlung von unserem Team bestätigt wurde, erhalten Sie den Zoom-Link zur Teilnahme am Webinar. Bitte rechnen Sie für die Zahlungsbestätigung mit 1–2 Werktagen.

Eine Bestätigungs-E-Mail mit diesen Angaben wurde an **{email}** gesendet.

Bei Fragen antworten Sie auf die Bestätigungs-E-Mail oder kontaktieren Sie uns unter {admin_email}.`,
    },
    "rejected-page": {
      enTitle: "Rejected Page",
      deTitle: "Ablehnungsseite",
      enBody: `{rejection_reason}

Immigration programs evolve. If your circumstances change, we encourage you to re-apply in the future.

If you believe this assessment is incorrect, please contact us.`,
      deBody: `{rejection_reason}

Migrationsprogramme entwickeln sich weiter. Wenn sich Ihre Situation ändert, ermutigen wir Sie zu einer erneuten Bewerbung in der Zukunft.

Wenn Sie der Meinung sind, dass diese Beurteilung nicht korrekt ist, kontaktieren Sie uns bitte.`,
    },
    disclaimer: {
      enTitle: "Disclaimer",
      deTitle: "Haftungsausschluss",
      enBody: `[REVIEW WITH LAWYER BEFORE PUBLISHING]

# Disclaimer

*Last updated: [DATE]*

## Not Legal or Immigration Advice

The information provided through our pre-screening form, webinar, and any related communications is for educational and informational purposes only. It does not constitute legal advice or immigration advice.

## No Guarantee of Visa Approval

Passing our pre-screening eligibility check does not guarantee that you will receive a Young Professional Visa Switzerland. All visa decisions are made solely and exclusively by the relevant Swiss immigration authorities. We have no influence over these decisions.

## Accuracy of Information

While we strive to provide accurate and up-to-date information about the Young Professional Visa Switzerland program, immigration regulations change frequently. Always verify current requirements with the official Swiss immigration authorities.

## Professional Advice

For your specific situation, we strongly recommend consulting a qualified immigration lawyer or official immigration advisor.

## Limitation of Liability

To the maximum extent permitted by law, we disclaim all liability arising from reliance on information provided through our service.`,

      deBody: `[VOR DER VERÖFFENTLICHUNG VON ANWALT PRÜFEN LASSEN]

# Haftungsausschluss

*Zuletzt aktualisiert: [DATUM]*

## Keine Rechts- oder Migrationsberatung

Die über unser Vorprüfungsformular, das Webinar und alle damit verbundenen Kommunikationen bereitgestellten Informationen dienen ausschliesslich Bildungs- und Informationszwecken. Sie stellen keine Rechtsberatung und keine Migrationsberatung dar.

## Keine Garantie für eine Visumsbewilligung

Das Bestehen unserer Eignungs-Vorprüfung garantiert nicht den Erhalt eines Young Professional Visa Schweiz. Alle Visumsentscheidungen werden ausschliesslich von den zuständigen Schweizer Migrationsbehörden getroffen. Auf diese Entscheidungen haben wir keinen Einfluss.

## Richtigkeit der Informationen

Wir bemühen uns um genaue und aktuelle Informationen zum Young Professional Visa Schweiz Programm. Migrationsbestimmungen ändern sich jedoch häufig. Überprüfen Sie aktuelle Anforderungen stets bei den offiziellen Schweizer Migrationsbehörden.

## Fachliche Beratung

Für Ihre individuelle Situation empfehlen wir dringend, eine qualifizierte Migrationsanwältin bzw. einen qualifizierten Migrationsanwalt oder eine offizielle Migrationsberatungsstelle zu konsultieren.

## Haftungsbeschränkung

Im gesetzlich höchstzulässigen Umfang lehnen wir jede Haftung ab, die aus dem Vertrauen auf die über unseren Dienst bereitgestellten Informationen entsteht.`,
    },
  };

  for (const slug of legalSlugs) {
    let pageId: number;
    const existingPage = db
      .select()
      .from(legalPages)
      .where(eq(legalPages.slug, slug))
      .get();

    if (!existingPage) {
      const result = db
        .insert(legalPages)
        .values({ slug, updatedAt: now })
        .returning({ id: legalPages.id })
        .get();
      pageId = result.id;
    } else {
      pageId = existingPage.id;
    }

    const content = legalContent[slug];
    for (const { locale, title, body } of [
      { locale: "en", title: content.enTitle, body: content.enBody },
      { locale: "de", title: content.deTitle, body: content.deBody },
    ]) {
      const existingTrans = db
        .select()
        .from(legalPageTranslations)
        .where(eq(legalPageTranslations.pageId, pageId))
        .all()
        .find((r) => r.locale === locale);
      if (!existingTrans) {
        db.insert(legalPageTranslations)
          .values({ pageId, locale, title, bodyMarkdown: body })
          .run();
      }
    }
  }

  // ─── Email Templates ───────────────────────────────────────────────────────
  const templates = [
    {
      key: "session_booking_confirmation",
      subject: "Your YPV Session — Booking Reference {booking_reference}",
      bodyText: `Dear {name},

Thank you for booking the Young Professional Visa Switzerland webinar.

─────────────────────────────────────
SESSION DETAILS
─────────────────────────────────────
Date: {session_date}
Time: {session_time} ({session_duration} minutes)
Price: USD {session_price}

─────────────────────────────────────
BOOKING REFERENCE
─────────────────────────────────────
{booking_reference}

Please use this reference when transferring payment via Wise.

─────────────────────────────────────
PAYMENT INSTRUCTIONS (Wise)
─────────────────────────────────────
{wise_details_block}

Reference (paste exactly): {booking_reference}

⚠ Complete your payment within 24 hours, otherwise your seat will be released to other applicants.

Once we verify your payment, we will send the Zoom link for your session by email.

If you have any questions, reply to this email or contact us at {admin_email}.

Warm regards,
The YPV Switzerland Team`,
    },
    {
      key: "session_zoom_link",
      subject: "Your YPV Webinar Zoom Link — {session_date}",
      bodyText: `Dear {name},

Your payment has been confirmed. Below are the details to join the upcoming webinar.

─────────────────────────────────────
SESSION ACCESS
─────────────────────────────────────
Date: {session_date}
Time: {session_time} ({session_duration} minutes)
Booking reference: {booking_reference}

Zoom link: {zoom_link}

Please join 5–10 minutes before the start time. We recommend testing your microphone and camera in advance.

If you have any questions, reply to this email or contact us at {admin_email}.

Warm regards,
The YPV Switzerland Team`,
    },
    {
      key: "eligible_participant",
      subject: "You're eligible — payment details for the YPV Switzerland Webinar",
      bodyText: `Dear {name},

Thank you for completing the pre-screening form for the Young Professional Visa Switzerland webinar.

We're pleased to confirm that you meet the initial eligibility criteria. To secure your place, please complete your payment using the Wise bank transfer details below.

This webinar is led by a Young Professional Visa holder who has successfully secured an opportunity in Switzerland and guided applicants from non-European countries through the process. Everything we share is based on real experience.

─────────────────────────────────────
WEBINAR DETAILS
─────────────────────────────────────
Webinar: {webinar_name}
Date: {webinar_date}
Price: {webinar_price}

─────────────────────────────────────
PAYMENT INSTRUCTIONS
─────────────────────────────────────
{wise_details_block}

Reference note: {reference_instruction}

─────────────────────────────────────

Once your payment is verified, you will receive the Zoom link to join the webinar.

If you have any questions, please reply to this email or contact us at {admin_email}.

Warm regards,
The YPV Switzerland Team`,
    },
    {
      key: "zoom_link",
      subject: "Your Zoom link for the YPV Switzerland Webinar",
      bodyText: `Dear {name},

Your payment has been confirmed. Below are the details to join the upcoming webinar.

─────────────────────────────────────
WEBINAR ACCESS
─────────────────────────────────────
Webinar: {webinar_name}
Date: {webinar_date}
Zoom link: {zoom_link}

Please join 5 minutes before the start time.

─────────────────────────────────────

If you have any questions, reply to this email or contact us at {admin_email}.

Warm regards,
The YPV Switzerland Team`,
    },
    {
      key: "admin_notification",
      subject: "New screening submission — {eligibility_status}",
      bodyText: `New screening submission received.

Submission ID: {submission_id}
Name: {name}
Email: {email}
Country: {country}
Age: {age}
Status: {eligibility_status}
Rejection reason: {rejection_reason}

Please log in to the admin panel to review this submission.`,
    },
  ];

  for (const t of templates) {
    const exists = db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.key, t.key))
      .get();
    if (!exists) {
      db.insert(emailTemplates)
        .values({ ...t, updatedAt: now })
        .run();
    }
  }

  console.log("[seed] Seed complete.");
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  /[\\/]seed\.(ts|js|mjs|cjs)$/.test(process.argv[1] ?? "");

if (invokedDirectly) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[seed] Seed failed:", err);
      process.exit(1);
    });
}
