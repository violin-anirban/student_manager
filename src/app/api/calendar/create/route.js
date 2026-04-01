import { google } from "googleapis";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function POST(request) {
  try {
    console.log("🚀 API Route: /api/calendar/create - Environment:", process.env.NODE_ENV);

    // Parse request
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return Response.json(
        { success: false, message: "Invalid JSON request" },
        { status: 400 }
      );
    }

    const { summary, description, startDateTime, endDateTime, timeZone } = requestData;

    if (!summary || !startDateTime || !endDateTime) {
      return Response.json(
        { success: false, message: "Missing required fields: summary, startDateTime, endDateTime" },
        { status: 400 }
      );
    }

    // Method 1: Try environment variables first (Vercel/Production)
    let serviceAccount = buildServiceAccountFromEnv();

    // Method 2: Fallback to local file (Development)
    if (!serviceAccount?.client_email) {
      console.log("🔍 Env vars not found, trying local service-account.json");
      serviceAccount = await loadServiceAccountFromFile();
    }

    if (!serviceAccount?.client_email) {
      return Response.json(
        { 
          success: false, 
          message: "Google Cloud credentials not configured",
          debug: { 
            hasEnv: !!process.env.GCP_CLIENT_EMAIL,
            hasLocalFile: existsSync(join(process.cwd(), "service-account.json"))
          }
        },
        { status: 500 }
      );
    }

    console.log("✅ Using service account:", serviceAccount.client_email);

    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events"
      ],
    });

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return Response.json(
        { success: false, message: "GOOGLE_CALENDAR_ID not configured" },
        { status: 500 }
      );
    }

    // Create event
    const event = {
      summary: summary.substring(0, 100),
      description: (description || "Music class session").substring(0, 8000),
      start: {
        dateTime: startDateTime,
        timeZone: timeZone || "Asia/Dhaka"
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone || "Asia/Dhaka"
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 }
        ]
      }
    };

    console.log("📅 Creating event:", summary);
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log("✅ Event created:", response.data.id);

    return Response.json({
      success: true,
      message: "Event created successfully",
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    });

  } catch (error) {
    console.error("❌ Calendar API Error:", {
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    const status = error.code === 403 ? 403 : 
                   error.code === 401 ? 401 : 
                   error.code === 404 ? 404 : 500;

    return Response.json({
      success: false,
      message: getErrorMessage(error),
      code: error.code
    }, { status });
  }
}

// Build service account from environment variables
function buildServiceAccountFromEnv() {
  const privateKey = process.env.GCP_PRIVATE_KEY;
  
  if (!privateKey || !process.env.GCP_CLIENT_EMAIL) {
    return null;
  }

  // Fix newlines in private key (Vercel stores \n as literal characters)
  const fixedPrivateKey = privateKey.replace(/\\n/g, '\n');
  
  return {
    type: process.env.GCP_TYPE || "service_account",
    project_id: process.env.GCP_PROJECT_ID,
    private_key_id: process.env.GCP_PRIVATE_KEY_ID,
    private_key: fixedPrivateKey,
    client_email: process.env.GCP_CLIENT_EMAIL,
    client_id: process.env.GCP_CLIENT_ID,
    auth_uri: process.env.GCP_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.GCP_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GCP_UNIVERSE_DOMAIN || "googleapis.com",
  };
}

// Load from local file (development fallback)
async function loadServiceAccountFromFile() {
  try {
    const serviceAccountPath = join(process.cwd(), "service-account.json");
    
    if (!existsSync(serviceAccountPath)) {
      console.log("❌ Local service-account.json not found");
      return null;
    }

    const rawData = readFileSync(serviceAccountPath, "utf8");
    const serviceAccount = JSON.parse(rawData);
    
    if (!serviceAccount.client_email) {
      console.error("❌ Invalid service account file: missing client_email");
      return null;
    }

    console.log("✅ Loaded local service account:", serviceAccount.client_email);
    return serviceAccount;
  } catch (error) {
    console.error("❌ Failed to load local service account:", error.message);
    return null;
  }
}

// User-friendly error messages
function getErrorMessage(error) {
  if (error.code === 403) {
    return "Calendar access denied. Ensure service account has 'Make changes to events' permission on the calendar.";
  }
  if (error.code === 401) {
    return "Authentication failed. Check service account credentials.";
  }
  if (error.code === 404) {
    return "Calendar not found. Check GOOGLE_CALENDAR_ID.";
  }
  return error.message || "Failed to create calendar event";
}