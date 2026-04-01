import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { SPREADSHEET_ID, SHEET_NAME, EMAIL_COLUMN, GOOGLE_API_KEY } = process.env;

    if (!SPREADSHEET_ID || !SHEET_NAME || !EMAIL_COLUMN || !GOOGLE_API_KEY) {
      console.error("Missing environment variables:", {
        SPREADSHEET_ID: !!SPREADSHEET_ID,
        SHEET_NAME: !!SHEET_NAME,
        EMAIL_COLUMN: !!EMAIL_COLUMN,
        GOOGLE_API_KEY: !!GOOGLE_API_KEY,
      });
      return res.status(500).json({ error: "Server configuration error: Missing environment variables" });
    }

    const sheets = google.sheets({ version: "v4", auth: GOOGLE_API_KEY });

    const range = `${SHEET_NAME}!${EMAIL_COLUMN}:${EMAIL_COLUMN}`;
    console.log("Fetching sheet data:", { email, spreadsheetId: SPREADSHEET_ID, range });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    const rows = response.data.values || [];
    const hasSubmitted = rows.some(
      (row) => row[0] && row[0].toLowerCase() === email.toLowerCase()
    );

    console.log("Check result:", { email, hasSubmitted, rowCount: rows.length });

    return res.status(200).json({ hasSubmitted });
  } catch (error) {
    console.error("Error checking form submission:", {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      code: error.code,
    });
  }
}