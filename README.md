# Young Professional Visa Switzerland — Pre-Screening Form

A production web application for paid webinar pre-screening for the Swiss Young Professional Visa program. Phase 1 covers the public form and eligibility engine. Phase 2 (not yet built) adds admin panel, AI analysis, and email HTML editor.

## Architecture

```
Browser
  │
  ├─ GET  /[locale]              Landing page
  ├─ GET  /[locale]/form         Multi-step form (React Hook Form)
  ├─ POST /api/screen            Eligibility check → stores submission
  ├─ POST /api/submit            Final submit → email + sheets sync
  ├─ GET  /[locale]/success      Payment instructions
  ├─ GET  /[locale]/rejected     Rejection page (i18n reason)
  ├─ GET  /[locale]/legal/[slug] Legal pages (from DB)
  └─ GET  /api/health            Health check (Docker)

Server (Node.js, long-lived)
  │
  ├─ SQLite (Drizzle ORM, WAL mode)   /data/ypv.db
  ├─ Nodemailer (Gmail SMTP)
  └─ Google Sheets API (googleapis)
```

## Local Development

```bash
# 1. Clone and install
git clone <repo>
cd ypv-mote
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL=file:./dev.db for local

# 3. Run migrations and seed
npm run db:migrate
npm run db:seed

# 4. Start dev server (port 3004)
npm run dev
```

Open http://localhost:3004

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3004 |
| `npm run build` | Production build |
| `npm run start` | Production server on port 3004 |
| `npm run db:generate` | Generate new Drizzle migration |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed default config, questions, legal pages |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run typecheck` | TypeScript check |

## Deploy to Easypanel

1. **Create App service** in Easypanel
2. **Source:** GitHub → select this repo
3. **Build:** Dockerfile (auto-detected)
4. **Port:** 3004
5. **Volume:** Add persistent volume → mount path `/data`
6. **Environment variables** (set in Easypanel):

```
NODE_ENV=production
DATABASE_URL=file:/data/ypv.db
APP_URL=https://your-domain.com
PORT=3004

# SMTP (Gmail)
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your@gmail.com
SMTP_FROM_NAME=YPV Switzerland

# Google Sheets (optional)
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_SHEETS_SHEET_ID=your-sheet-id
```

7. **Custom domain:** In Easypanel → Domains → add domain → copy CNAME
8. **Namecheap DNS:** Add CNAME record pointing to Easypanel hostname
9. **Healthcheck path:** `/api/health`
10. **Deploy** — Easypanel builds via Dockerfile and starts container

### First-time setup after deploy

Migrations and seed run automatically on container start (via `src/db/migrate.ts`). After first deploy:
- Log in to Easypanel terminal
- Set Wise payment details via DB (Phase 2 admin panel will expose UI):
  ```sql
  UPDATE app_settings SET value = 'Your Name' WHERE key = 'wise.account_holder';
  UPDATE app_settings SET value = 'your@email.com' WHERE key = 'admin.notification_email';
  -- etc.
  ```

## Google Sheets Setup

1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create a service account → download JSON key
4. Share your Google Sheet with the service account email
5. Set `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` to the full JSON content
6. Set `GOOGLE_SHEETS_SHEET_ID` to the sheet ID from the URL

### Sheet column order

`id | locale | full_name | email | phone | country | date_of_birth | age_at_submission | vocational_training_completed | interested_in_field | english_level | worked_abroad | has_passport | professional_experience | diploma_in_english | current_location | eligibility_status | rejection_reason_key | payment_status | created_at`

## Eligibility Rules

Rules are hardcoded in `src/lib/eligibility/engine.ts`. Config values (country list, age ranges) are stored in the `eligibility_config` table and can be updated directly in the database. Phase 2 admin panel will expose a UI editor.

Default config:
- Valid countries: Argentina, Australia, Canada, Chile, Indonesia, Japan, Monaco, New Zealand, Philippines, Russia, San Marino, South Africa, Tunisia, Ukraine, USA
- Default age range: 18–35
- Australia: 20–30 | New Zealand: 18–30 | Russia: 18–30
- Requires vocational training: yes
- Requires field interest: yes

## i18n

- Locales: `en` (English, default), `zh` (Mandarin Simplified)
- URL: `/en/...` and `/zh/...` — root `/` redirects to `/en`
- Static strings: `messages/en.json`, `messages/zh.json`
- Dynamic content (questions, legal pages): stored in DB with locale translations

## Phase 2 (not yet built)

- Admin panel (better-auth authentication)
- AI eligibility analysis (Groq API)
- Email HTML editor
- Dynamic question editor
- Payment verification workflow
- CSV export
- Dashboard with submission analytics

All Phase 2 database tables are already migrated and ready.

## Troubleshooting

**DB locked:** SQLite WAL mode is enabled. If you see `SQLITE_BUSY`, ensure only one process writes at a time. Docker deployment uses a single container — this is fine.

**SMTP connection errors:** For Gmail, use an App Password (not your account password). Enable 2FA on your Google account first, then create an App Password at myaccount.google.com/apppasswords.

**Google Sheets auth errors:** Check that the service account has Editor access to the sheet. The full JSON key must be valid JSON — paste it as a single line in the env var.

**Build fails with `better-sqlite3` errors:** The Dockerfile includes `python3 make g++` for native module compilation on Alpine. If building locally on macOS, ensure Xcode command line tools are installed.
