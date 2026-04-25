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

const now = new Date().toISOString();

async function seed() {
  console.log("Seeding database...");

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
      zh: { label: "您的全名是什么？", placeholder: "张伟", helpText: null },
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
      zh: { label: "您的电子邮箱", placeholder: "您@example.com", helpText: null },
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
      zh: { label: "您的电话号码", placeholder: "+41 xxx xxx xx xx", helpText: null },
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
      zh: { label: "您持有哪个国家的护照？", placeholder: "选择您的国家", helpText: null },
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
      zh: { label: "出生日期", placeholder: "YYYY-MM-DD", helpText: null },
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
      zh: {
        label: "您是否完成了职业培训或大学学历？",
        placeholder: null,
        helpText:
          "学徒制、应用科学大学、普通大学、SMK（印度尼西亚）。美国/加拿大学生可申请；在相关职业有2年以上工作经验的美国学徒可申请。",
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
      zh: { label: "您是否有兴趣在您所学专业领域工作？", placeholder: null, helpText: null },
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
      zh: { label: "您的英语水平如何？", placeholder: null, helpText: null },
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
      zh: { label: "您是否有在海外工作的经历？", placeholder: null, helpText: null },
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
      zh: { label: "您目前是否持有有效护照？", placeholder: null, helpText: null },
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
      zh: { label: "您有多少年的专业工作经验？", placeholder: null, helpText: null },
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
      zh: { label: "您的文凭/学位证书是英文版本吗？", placeholder: null, helpText: null },
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
      zh: { label: "您目前在哪里？", placeholder: null, helpText: null },
    },
  ];

  const questionOptions_data: Record<
    string,
    { value: string; order: number; en: string; zh: string }[]
  > = {
    country: [
      { value: "Argentina", order: 1, en: "Argentina", zh: "阿根廷" },
      { value: "Australia", order: 2, en: "Australia", zh: "澳大利亚" },
      { value: "Canada", order: 3, en: "Canada", zh: "加拿大" },
      { value: "Chile", order: 4, en: "Chile", zh: "智利" },
      { value: "Indonesia", order: 5, en: "Indonesia", zh: "印度尼西亚" },
      { value: "Japan", order: 6, en: "Japan", zh: "日本" },
      { value: "Monaco", order: 7, en: "Monaco", zh: "摩纳哥" },
      { value: "New Zealand", order: 8, en: "New Zealand", zh: "新西兰" },
      { value: "Philippines", order: 9, en: "Philippines", zh: "菲律宾" },
      { value: "Russia", order: 10, en: "Russia", zh: "俄罗斯" },
      { value: "San Marino", order: 11, en: "San Marino", zh: "圣马力诺" },
      { value: "South Africa", order: 12, en: "South Africa", zh: "南非" },
      { value: "Tunisia", order: 13, en: "Tunisia", zh: "突尼斯" },
      { value: "Ukraine", order: 14, en: "Ukraine", zh: "乌克兰" },
      { value: "USA", order: 15, en: "USA", zh: "美国" },
      { value: "Others", order: 16, en: "Others", zh: "其他" },
    ],
    vocational_training_completed: [
      { value: "yes", order: 1, en: "Yes", zh: "是" },
      { value: "no", order: 2, en: "No", zh: "否" },
    ],
    interested_in_field: [
      { value: "yes", order: 1, en: "Yes", zh: "是" },
      { value: "no", order: 2, en: "No", zh: "否" },
    ],
    english_level: [
      { value: "beginner", order: 1, en: "Beginner (A1–A2)", zh: "初级（A1–A2）" },
      { value: "intermediate", order: 2, en: "Intermediate (B1–B2)", zh: "中级（B1–B2）" },
      { value: "advanced", order: 3, en: "Advanced (C1–C2)", zh: "高级（C1–C2）" },
      { value: "none", order: 4, en: "I don't speak English", zh: "我不会英语" },
    ],
    worked_abroad: [
      { value: "yes", order: 1, en: "Yes", zh: "是" },
      { value: "no", order: 2, en: "No", zh: "否" },
    ],
    has_passport: [
      { value: "yes", order: 1, en: "Yes, I have a valid passport", zh: "是，我有有效护照" },
      { value: "no", order: 2, en: "No", zh: "否" },
      { value: "plan_to_make", order: 3, en: "Not yet, but I plan to apply for one", zh: "暂无，但我计划申请" },
    ],
    professional_experience: [
      { value: "fresh_graduate", order: 1, en: "Fresh graduate / no experience", zh: "应届毕业生/无工作经验" },
      { value: "1_2_years", order: 2, en: "1–2 years", zh: "1–2年" },
      { value: "2_3_years", order: 3, en: "2–3 years", zh: "2–3年" },
      { value: "3_5_years", order: 4, en: "3–5 years", zh: "3–5年" },
      { value: "5_plus_years", order: 5, en: "5+ years", zh: "5年以上" },
    ],
    diploma_in_english: [
      { value: "yes", order: 1, en: "Yes", zh: "是" },
      { value: "no", order: 2, en: "No", zh: "否" },
    ],
    current_location: [
      { value: "own_country", order: 1, en: "In my home country", zh: "在我的祖国" },
      { value: "abroad", order: 2, en: "Abroad", zh: "在海外" },
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
    for (const locale of ["en", "zh"] as const) {
      const t = locale === "en" ? q.en : q.zh;
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
      for (const locale of ["en", "zh"] as const) {
        const label = locale === "en" ? opt.en : opt.zh;
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
    { enTitle: string; zhTitle: string; enBody: string; zhBody: string }
  > = {
    privacy: {
      enTitle: "Privacy Policy",
      zhTitle: "隐私政策",
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
- Assess your eligibility for the Swiss Young Professional Visa webinar
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

      zhBody: `[发布前请律师审阅]

# 隐私政策

*最后更新：[日期]*

瑞士青年职业签证预筛选表格（"我们"）致力于按照《通用数据保护条例》（GDPR）及适用数据保护法律保护您的个人数据。

## 1. 我们收集的数据

当您填写预筛选表格时，我们收集以下信息：
- 全名
- 电子邮箱地址
- 电话号码
- 出生日期
- 护照国籍
- 教育和职业背景信息

## 2. 数据使用方式

您的数据仅用于：
- 评估您参加瑞士青年职业签证研讨会的资格
- 向您发送付款及研讨会访问说明
- 出于合法商业目的维护我们的记录

## 3. 数据存储

您的数据安全存储在我们的服务器上，经您同意后，也可存储在仅授权管理员可访问的Google表格中。

## 4. 数据保留期

我们在提交后最多保留您的数据24个月。您可随时联系我们请求删除。

## 5. 您的权利

根据GDPR，您有权访问、更正、删除、限制处理和转移您的数据。如需行使这些权利，请通过以下联系方式联系我们。

## 6. 联系方式

数据保护咨询：[管理员邮箱 - 待配置]`,
    },
    terms: {
      enTitle: "Terms of Service",
      zhTitle: "服务条款",
      enBody: `[REVIEW WITH LAWYER BEFORE PUBLISHING]

# Terms of Service

*Last updated: [DATE]*

By submitting the pre-screening form and making payment, you agree to the following terms.

## 1. Service Description

We provide an informational webinar about the Swiss Young Professional Visa program. This is an educational service only — we are not a visa agency and do not guarantee any visa outcome.

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

      zhBody: `[发布前请律师审阅]

# 服务条款

*最后更新：[日期]*

提交预筛选表格并完成付款，即表示您同意以下条款。

## 1. 服务说明

我们提供有关瑞士青年职业签证项目的信息性研讨会。这仅为教育服务——我们不是签证代理机构，不保证任何签证结果。

## 2. 资格预审

通过我们的预审并不保证签证获批。最终资格由瑞士当局单独决定。

## 3. 付款

参加研讨会需要付款。取消相关详情请参阅我们的退款政策。

## 4. 行为规范

参与者同意在研讨会期间保持尊重的态度。我们保留对行为扰乱参与者的驱逐权利。

## 5. 知识产权

所有研讨会内容均受版权保护。未经书面同意，禁止录制、复制或分发。

## 6. 责任限制

我们对移民当局的决定不承担任何责任。所提供的信息仅供教育目的使用。

## 7. 适用法律

本条款受瑞士法律管辖。`,
    },
    cookie: {
      enTitle: "Cookie Policy",
      zhTitle: "Cookie政策",
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

      zhBody: `[发布前请律师审阅]

# Cookie政策

*最后更新：[日期]*

## 什么是Cookie

Cookie是您访问我们网站时放置在您设备上的小型文本文件。

## 我们使用的Cookie

**会话Cookie（必要）：** 我们使用单个会话Cookie来维持您的表格填写进度，未来也用于支持管理员登录。此Cookie是严格必要的，无法禁用。

我们不使用跟踪Cookie、广告Cookie或第三方分析Cookie。

## 管理Cookie

您可以在浏览器设置中禁用Cookie。请注意，禁用会话Cookie将导致表格无法正常运行。

## 联系方式

Cookie相关咨询：[管理员邮箱 - 待配置]`,
    },
    refund: {
      enTitle: "Refund Policy",
      zhTitle: "退款政策",
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

      zhBody: `[发布前请律师审阅]

# 退款政策

*最后更新：[日期]*

## 退款资格

以下情况可获全额退款：
- 您在预定研讨会日期至少48小时前提出退款申请
- 研讨会因我方原因取消

## 不可退款情况

以下情况我们无法提供退款：
- 在研讨会开始前48小时内提出申请
- 因个人原因无法参加（网络问题、时间冲突等）
- 您已经参加了研讨会

## 申请流程

如需申请退款，请发送邮件至 [管理员邮箱 - 待配置]，附上您的提交ID和付款凭证。退款将在7个工作日内处理。

## 货币及手续费

退款以原始货币支付。银行转账手续费不予退还。`,
    },
    "success-page": {
      enTitle: "Success Page",
      zhTitle: "成功页面",
      enBody: `## Dear {name},

You have passed our initial eligibility check for the Swiss Young Professional Visa webinar.

## Payment Instructions

To secure your place, please transfer the webinar fee to the following Wise account:

{wise_details_block}

**Transfer reference:** {wise_reference_instruction}

**Webinar date:** {webinar_date} · **Fee:** {webinar_price}

## What happens next?

Once your payment is verified by our team, you will receive the Zoom link to join the webinar. Please allow 1–2 business days for payment verification.

A confirmation email with these details has been sent to **{email}**.

For questions, reply to the confirmation email or contact us at {admin_email}.`,
      zhBody: `## 亲爱的 {name}，

您已通过瑞士青年职业签证研讨会的初步资格审核。

## 付款说明

为保留您的席位，请将研讨会费用转账至以下 Wise 账户：

{wise_details_block}

**转账备注：** {wise_reference_instruction}

**研讨会日期：** {webinar_date} · **费用：** {webinar_price}

## 接下来会发生什么？

我们的团队核实付款后，您将收到加入研讨会的 Zoom 链接。付款核实通常需要 1–2 个工作日。

包含上述详情的确认邮件已发送至 **{email}**。

如有疑问，请回复确认邮件或通过 {admin_email} 联系我们。`,
    },
    "rejected-page": {
      enTitle: "Rejected Page",
      zhTitle: "未通过页面",
      enBody: `{rejection_reason}

Immigration programs evolve. If your circumstances change, we encourage you to re-apply in the future.

If you believe this assessment is incorrect, please contact us.`,
      zhBody: `{rejection_reason}

移民项目会不断发展变化。如果您的情况有所改变，我们鼓励您在未来重新申请。

如果您认为此评估有误，请联系我们。`,
    },
    disclaimer: {
      enTitle: "Disclaimer",
      zhTitle: "免责声明",
      enBody: `[REVIEW WITH LAWYER BEFORE PUBLISHING]

# Disclaimer

*Last updated: [DATE]*

## Not Legal or Immigration Advice

The information provided through our pre-screening form, webinar, and any related communications is for educational and informational purposes only. It does not constitute legal advice or immigration advice.

## No Guarantee of Visa Approval

Passing our pre-screening eligibility check does not guarantee that you will receive a Swiss Young Professional Visa. All visa decisions are made solely and exclusively by the relevant Swiss immigration authorities. We have no influence over these decisions.

## Accuracy of Information

While we strive to provide accurate and up-to-date information about the Swiss Young Professional Visa program, immigration regulations change frequently. Always verify current requirements with the official Swiss immigration authorities.

## Professional Advice

For your specific situation, we strongly recommend consulting a qualified immigration lawyer or official immigration advisor.

## Limitation of Liability

To the maximum extent permitted by law, we disclaim all liability arising from reliance on information provided through our service.`,

      zhBody: `[发布前请律师审阅]

# 免责声明

*最后更新：[日期]*

## 非法律或移民建议

通过我们的预筛选表格、研讨会及相关沟通提供的信息仅供教育和参考目的。这不构成法律建议或移民建议。

## 不保证签证获批

通过我们的预筛选资格审查并不保证您能获得瑞士青年职业签证。所有签证决定完全由相关瑞士移民机构单独做出。我们对这些决定没有任何影响力。

## 信息准确性

虽然我们努力提供有关瑞士青年职业签证项目的准确和最新信息，但移民法规经常变化。请务必向官方瑞士移民机构核实最新要求。

## 专业建议

对于您的具体情况，我们强烈建议咨询有资质的移民律师或官方移民顾问。

## 责任限制

在法律允许的最大范围内，我们对因依赖我们服务提供的信息而产生的任何损失不承担责任。`,
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
      { locale: "zh", title: content.zhTitle, body: content.zhBody },
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
      key: "eligible_participant",
      subject: "You're eligible — here are your payment details for the YPV Switzerland Webinar",
      bodyText: `Dear {name},

Thank you for completing the pre-screening form for the Young Professional Visa Switzerland webinar.

We are pleased to confirm that you meet the initial eligibility criteria. To secure your place, please complete your payment using the Wise bank transfer details below.

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

Your payment has been confirmed. Here are your details to join the upcoming webinar.

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

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
