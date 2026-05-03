import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

function getEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

async function getSetting(key: string): Promise<string> {
  const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
  return row?.value ?? "";
}

export async function getSmtpConfig() {
  return {
    host: (getEnv("SMTP_HOST") ?? (await getSetting("smtp.host"))) || "smtp.gmail.com",
    port: parseInt((getEnv("SMTP_PORT") ?? (await getSetting("smtp.port"))) || "587"),
    user: getEnv("SMTP_USER") ?? (await getSetting("smtp.user")),
    pass: getEnv("SMTP_PASS") ?? (await getSetting("smtp.pass")),
    fromEmail: getEnv("SMTP_FROM_EMAIL") ?? (await getSetting("smtp.from_email")),
    fromName: getEnv("SMTP_FROM_NAME") ?? (await getSetting("smtp.from_name")),
  };
}

export async function getWiseConfig() {
  return {
    accountHolder: await getSetting("wise.account_holder"),
    accountNumber: await getSetting("wise.account_number"),
    swiftBic: await getSetting("wise.swift_bic"),
    bankName: await getSetting("wise.bank_name"),
    bankAddress: await getSetting("wise.bank_address"),
    referenceInstruction: await getSetting("wise.reference_instruction"),
  };
}

export async function getBcaConfig() {
  return {
    accountHolder: await getSetting("bca.account_holder"),
    accountNumber: await getSetting("bca.account_number"),
    bankName: (await getSetting("bca.bank_name")) || "BCA",
    bankBranch: await getSetting("bca.bank_branch"),
  };
}

export async function getWebinarConfig() {
  return {
    name: await getSetting("webinar.name"),
    price: await getSetting("webinar.price"),
    date: await getSetting("webinar.date"),
    zoomLink: await getSetting("webinar.zoom_link"),
  };
}

export async function getSheetsConfig() {
  return {
    serviceAccountJson:
      getEnv("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON") ??
      (await getSetting("sheets.service_account_json")),
    sheetId:
      getEnv("GOOGLE_SHEETS_SHEET_ID") ?? (await getSetting("sheets.sheet_id")),
    tabName: await getSetting("sheets.tab_name"),
  };
}

export async function getAdminNotificationEmail(): Promise<string> {
  return await getSetting("admin.notification_email");
}
