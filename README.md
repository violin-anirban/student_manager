# Artist Portfolio & Studio Manager

A full-stack studio management tool for music educators built with Next.js and Supabase. Features a professional portfolio, Google Calendar integration, student class scheduling, payment tracking, and an admin dashboard.

**Live Demo:** [violinanirban.vercel.app](https://violinanirban.vercel.app)

---

## Features

- **Portfolio** — Dynamic showcase with hero slideshow, biography, guru lineage tree, YouTube video gallery, upcoming/past concerts
- **Student Login** — Google OAuth via Supabase Auth
- **Class Scheduling** — Students request classes with date/time; admin approves/declines
- **Google Calendar Sync** — Approved classes are automatically added to the teacher's Google Calendar
- **Payment System** — Students submit payment proof (UPI/bank transfer); admin approves and credits are added
- **Admin Dashboard** — Passcode-protected admin panel to manage requests, students, content, and a full database browser with PDF export
- **Content Management** — Admin can add/edit/delete notices, concerts, and videos
- **Real-time Updates** — Student dashboard updates live when admin approves/declines requests

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4
- **Database & Auth:** Supabase (PostgreSQL + Auth + Realtime)
- **APIs:** Google Calendar API, Google Sheets API
- **Deployment:** Vercel

---

## Setup Guide

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- A Google Cloud Platform account
- Git

---

### Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd class_organizer
npm install
```

---

### Step 2: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning
3. Note down these values from **Settings > API**:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

---

### Step 3: Run the Database Migration

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase_migration.sql` from this repo and copy its entire contents
4. Paste into the SQL Editor and click **Run**

This creates all 8 tables, RPC functions for atomic operations, Row Level Security policies, and enables Realtime.

---

### Step 4: Set Up Google OAuth (for student login)

#### 4a. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add to **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local dev)
   - `https://your-app.vercel.app` (for production)
7. Add to **Authorized redirect URIs**:
   - `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback`
8. Click **Create** and note down the **Client ID** and **Client Secret**

#### 4b. Enable Google Provider in Supabase

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Find **Google** and toggle it **ON**
3. Enter your **Client ID** and **Client Secret** from step 4a
4. Click **Save**

#### 4c. Configure Redirect URLs in Supabase

1. Go to **Authentication > URL Configuration**
2. Set **Site URL** to:
   - `http://localhost:3000` (for local dev)
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - `https://your-app.vercel.app/**` (for production)

---

### Step 5: Set Up Google Calendar API (for auto-scheduling)

This allows the app to create Google Calendar events when the admin approves a class request.

1. In [Google Cloud Console](https://console.cloud.google.com/), enable the **Google Calendar API**
2. Go to **IAM & Admin > Service Accounts**
3. Create a new service account (or use an existing one)
4. Click the service account > **Keys** tab > **Add Key > Create new key > JSON**
5. Download the JSON key file
6. Share your Google Calendar with the service account email (give it **"Make changes to events"** permission):
   - Open Google Calendar > Settings > your calendar > Share with specific people
   - Add the service account email (e.g., `my-app@my-project.iam.gserviceaccount.com`)

From the JSON key file, extract the values for the environment variables listed in Step 7.

---

### Step 6: Set Up Google Sheets API (for registration check)

This checks if a student has submitted the registration Google Form.

1. In [Google Cloud Console](https://console.cloud.google.com/), enable the **Google Sheets API**
2. Create an API key: **APIs & Services > Credentials > Create Credentials > API Key**
3. Create a Google Form for student registration
4. Link the Form to a Google Sheet (Form > Responses > Link to Sheets)
5. Note the **Spreadsheet ID** from the sheet URL:
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
6. Make sure the email column is column **B** (or adjust `EMAIL_COLUMN` in `.env`)

---

### Step 7: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Google Sheets (for registration check)
GOOGLE_API_KEY=<your-google-api-key>
SPREADSHEET_ID=<your-spreadsheet-id>
SHEET_NAME=Sheet1
EMAIL_COLUMN=B

# Google Calendar
GOOGLE_CALENDAR_ID=<your-google-calendar-email>

# GCP Service Account (from the JSON key file)
GCP_TYPE=service_account
GCP_PROJECT_ID=<your-gcp-project-id>
GCP_PRIVATE_KEY_ID=<private-key-id>
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCP_CLIENT_EMAIL=<service-account-email>
GCP_CLIENT_ID=<client-id>
GCP_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GCP_TOKEN_URI=https://oauth2.googleapis.com/token
GCP_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GCP_CLIENT_X509_CERT_URL=<your-cert-url>
GCP_UNIVERSE_DOMAIN=googleapis.com

# Admin passcode (server-side only)
ADMIN_PASSCODE=<choose-a-strong-passcode>
```

---

### Step 8: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the portfolio.

---

## Routes & Access

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Portfolio homepage |
| `/students` | Public | Student login page |
| `/portfolio` | Public | Alternative login page |
| `/gallery` | Public | Photo gallery |
| `/gurus-lineage` | Public | Guru lineage tree |
| `/user/[uid]` | Authenticated | Student dashboard |
| `/user/[uid]/buy-credit` | Authenticated | Payment form |
| `/user/[uid]/complete-form` | Authenticated | Registration redirect |
| `/admin` | Passcode | Admin dashboard |
| `/admin/content` | Passcode | Content management |
| `/admin/userdata` | Passcode | Student data viewer |
| `/admin/securedData` | Passcode | Database browser & PDF export |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Student/admin profiles, credits, class fee |
| `classesRequests` | Class scheduling requests with status tracking |
| `creditRequests` | Payment/credit purchase requests |
| `notices` | Admin announcements for students |
| `upcomingConcerts` | Future concert events |
| `pastConcerts` | Archived concerts |
| `videos` | YouTube video links for portfolio |
| `guestlist` | Guest list (reserved) |

---

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add all environment variables from `.env` to the Vercel project settings
4. Deploy
5. Update Supabase URL Configuration:
   - Set **Site URL** to your Vercel domain
   - Add `https://your-app.vercel.app/**` to **Redirect URLs**
6. Update Google Cloud Console OAuth credentials:
   - Add your Vercel domain to **Authorized JavaScript origins**
   - The Supabase callback URL stays the same

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Unsupported provider" on login | Enable Google in Supabase > Authentication > Providers |
| "Unable to exchange external code" | Wrong Google OAuth Client Secret in Supabase |
| Login works but no redirect | Add your app URL to Supabase > Authentication > URL Configuration > Redirect URLs |
| Calendar events not created | Share your Google Calendar with the GCP service account email |
| "User profile not found" | Make sure the SQL migration was run successfully |
| Admin page blocked | Enter the passcode set in `ADMIN_PASSCODE` env variable |
