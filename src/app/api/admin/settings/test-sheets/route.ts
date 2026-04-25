import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getSheetsClient } from "@/lib/sheets/client";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { sheets, sheetId, tabName } = await getSheetsClient();
    // Write a test row then delete it
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [["__test__", new Date().toISOString()]] },
    });
    // Try to clear the test row
    const range = appendRes.data.updates?.updatedRange;
    if (range) {
      await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
