import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

// ─── Submissions ────────────────────────────────────────────────────────────

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  locale: text("locale").notNull().default("en"),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  country: text("country"),
  dateOfBirth: text("date_of_birth"),
  ageAtSubmission: integer("age_at_submission"),
  vocationalTrainingCompleted: integer("vocational_training_completed"),
  interestedInField: integer("interested_in_field"),
  englishLevel: text("english_level"),
  workedAbroad: integer("worked_abroad"),
  hasPassport: text("has_passport"),
  professionalExperience: text("professional_experience"),
  diplomaInEnglish: integer("diploma_in_english"),
  currentLocation: text("current_location"),
  eligibilityStatus: text("eligibility_status").notNull(),
  rejectionReasonKey: text("rejection_reason_key"),
  rejectionReasonDetails: text("rejection_reason_details"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentVerifiedAt: text("payment_verified_at"),
  paymentVerifiedBy: text("payment_verified_by"),
  emailSentAt: text("email_sent_at"),
  sheetSyncedAt: text("sheet_synced_at"),
  adminNotes: text("admin_notes"),
  extraResponses: text("extra_responses"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Eligibility Config ──────────────────────────────────────────────────────

export const eligibilityConfig = sqliteTable("eligibility_config", {
  id: integer("id").primaryKey(),
  validCountries: text("valid_countries").notNull(),
  defaultAgeMin: integer("default_age_min").notNull(),
  defaultAgeMax: integer("default_age_max").notNull(),
  countryAgeOverrides: text("country_age_overrides").notNull(),
  requireVocationalTraining: integer("require_vocational_training").notNull(),
  requireFieldInterest: integer("require_field_interest").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

// ─── Form Questions ──────────────────────────────────────────────────────────

export const formQuestions = sqliteTable("form_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  type: text("type").notNull(),
  section: integer("section").notNull(),
  order: integer("order").notNull(),
  required: integer("required").notNull().default(1),
  isEligibilityGate: integer("is_eligibility_gate").notNull().default(0),
  validationRule: text("validation_rule"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const questionOptions = sqliteTable("question_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull(),
  value: text("value").notNull(),
  order: integer("order").notNull(),
});

export const questionTranslations = sqliteTable(
  "question_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    questionId: integer("question_id"),
    optionId: integer("option_id"),
    locale: text("locale").notNull(),
    label: text("label").notNull(),
    placeholder: text("placeholder"),
    helpText: text("help_text"),
  }
);

// ─── Legal Pages ─────────────────────────────────────────────────────────────

export const legalPages = sqliteTable("legal_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  updatedAt: text("updated_at").notNull(),
});

export const legalPageTranslations = sqliteTable(
  "legal_page_translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pageId: integer("page_id").notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    bodyMarkdown: text("body_markdown").notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("legal_page_translations_page_locale").on(
      t.pageId,
      t.locale
    ),
  })
);

// ─── App Settings ────────────────────────────────────────────────────────────

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Email Templates ─────────────────────────────────────────────────────────

export const emailTemplates = sqliteTable("email_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

// ─── Admin Users (Phase 2 — better-auth) ────────────────────────────────────

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("admin"),
  mustChangePassword: integer("must_change_password").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adminSessions = sqliteTable("admin_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// ─── Sync Logs (Phase 2) ─────────────────────────────────────────────────────

export const syncLogs = sqliteTable("sync_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: text("submission_id").notNull(),
  service: text("service").notNull(),
  action: text("action").notNull().default("initial"),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
});

// ─── Email Logs (Phase 2) ────────────────────────────────────────────────────

export const emailLogs = sqliteTable("email_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: text("submission_id"),
  templateKey: text("template_key").notNull(),
  toEmail: text("to_email").notNull(),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
});

// ─── Webinar Sessions (multi-session scheduling) ─────────────────────────────

export const webinarSessions = sqliteTable(
  "webinar_sessions",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    time: text("time").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(120),
    capacity: integer("capacity").notNull().default(50),
    priceUsd: real("price_usd").notNull(),
    priceIdr: integer("price_idr"),
    zoomLink: text("zoom_link"),
    description: text("description"),
    status: text("status").notNull().default("draft"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    statusDateIdx: index("webinar_sessions_status_date").on(t.status, t.date),
  })
);

export const sessionBookings = sqliteTable(
  "session_bookings",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    sessionId: text("session_id").notNull(),
    bookingReference: text("booking_reference").notNull().unique(),
    paymentStatus: text("payment_status").notNull().default("pending"),
    expiresAt: text("expires_at"),
    paidAt: text("paid_at"),
    confirmedAt: text("confirmed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    sessionIdx: index("session_bookings_session_id").on(t.sessionId),
    expiresIdx: index("session_bookings_expires_at").on(t.expiresAt),
    submissionIdx: index("session_bookings_submission_id").on(t.submissionId),
  })
);

// ─── AI Analyses (Phase 2) ───────────────────────────────────────────────────

export const aiAnalyses = sqliteTable("ai_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: text("submission_id").notNull(),
  model: text("model").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  score: integer("score"),
  summary: text("summary"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by"),
});
