import { google } from "googleapis";
import { getSheetsConfig } from "@/lib/config";

export async function getSheetsClient() {
  const cfg = await getSheetsConfig();

  if (!cfg.serviceAccountJson) {
    throw new Error("Google Sheets service account JSON not configured");
  }

  const credentials = JSON.parse(cfg.serviceAccountJson) as object;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, sheetId: cfg.sheetId, tabName: cfg.tabName };
}
