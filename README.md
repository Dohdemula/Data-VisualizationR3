# InvenSight

Intelligent Inventory Forecasting and Sales Analytics System for Kenyan SME retail businesses.

Turns historical sales data into demand forecasts and inventory insights. Complements existing POS systems - it consumes their data for analysis, it does not replace them.

---

## Prerequisites

- **Node.js 22+** - required for the built-in `node:sqlite` module
- **npm**
- A **Resend account** (or any SMTP provider) for email - optional in development, Ethereal is used automatically as a fallback

Check your Node version:
```bash
node --version   # must be v22.x.x or higher
```

---

## Repo structure

```
Data-VisualizationR3/
├── server/                  # Express backend + auth + onboarding
│   ├── data/                # SQLite database (gitignored)
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── requests.js
│   │   ├── setup.js
│   │   └── users.js
│   ├── db.js
│   ├── email.js
│   ├── index.js
│   └── .env.example
└── visualization/           # React frontend (Vite)
    ├── src/
    │   ├── api/             # API adapter layer + mock data
    │   ├── components/      # Layout, UI primitives
    │   ├── context/         # RoleContext, GlobalFilterContext
    │   ├── pages/           # All screens + auth pages
    │   └── styles/          # CSS variables, global styles
    └── .env.example
```

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd Data-VisualizationR3

# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../visualization
npm install
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in the values:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

DB_PATH=./data/InvenSight.db

# true  = public/demo instance (hosts the request-access onboarding flow)
# false = private business instance (redirects to setup wizard until initialized)
IS_PUBLIC_INSTANCE=true

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<generate a long random secret>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_DAYS=7

# Must be the SAME value on the public instance and every private business instance
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
ADMIN_SECRET=<generate a long random secret>

# Developer/installer email - approval notifications and token confirmations go here
DEVELOPER_EMAIL=you@example.com

# Email (leave all blank in dev - Ethereal test account is auto-created)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="InvenSight <noreply@invensight.co.ke>"
```

**Using Resend for real email in development:**
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=<your resend api key>
SMTP_FROM="InvenSight <onboarding@resend.dev>"
```
> Without a verified custom domain, emails sent via `onboarding@resend.dev` will land in spam on most inboxes. For development, mark them as "Not spam" in Gmail. For production, verify your own domain in Resend and update `SMTP_FROM` accordingly.

### 3. Configure the frontend

```bash
cd visualization
cp .env.example .env
```

Open `visualization/.env`:

```env
# Point at the local server. Remove this line entirely to use mock data (no server needed).
VITE_API_BASE_URL=http://localhost:4000
```

---

## Running in development

Open three terminals:

**Terminal 1 — auth server:**
```bash
cd server
node --experimental-sqlite index.js
```

**Terminal 2 — forecasting server (David's module):**
```bash
cd ../forecasting_module      # cloned separately
python manage.py runserver 0.0.0.0:8000
```

**Terminal 3 — frontend:**
```bash
cd visualization
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Auth / data server | http://localhost:4000 |
| Forecasting server | http://127.0.0.1:8000 |

The forecasting server is optional — if it isn't running, the Forecasts and Model Insights screens fall back to mock data automatically (when `VITE_API_BASE_URL` is unset) or show an error (when pointed at the real server).

---

## Mock mode (no server needed)

Remove or leave blank `VITE_API_BASE_URL` in `visualization/.env`. The frontend runs entirely on mock data — all nine dashboard screens work with no server running. Useful for frontend-only development.

Demo accounts (accessible from the login page and the setup wizard) always work in mock mode.

> **Integration status:** Forecasts and Model Insights screens are wired to David's forecasting module (port 8000). Overview, Inventory, Alerts, Sales Analytics, Reorder, and Reports are pending Brian's REST API — they run on realistic mock data until his endpoints are ready.

---

## Instance types

InvenSight is **single-tenant** - one deployment per business. Two instance types exist:

### Public instance (`IS_PUBLIC_INSTANCE=true`)
Hosted by the installer/developer. This is the reference deployment that prospective customers visit first. It hosts the onboarding request form. No real business data lives here.

### Private / business instance (`IS_PUBLIC_INSTANCE=false`)
One per customer business. Contains that business's data and users. On first boot (no accounts, not initialized), every route redirects to the setup wizard. After initialization, normal operation.

Both instance types must share the same `ADMIN_SECRET`. This is what allows setup tokens generated on the public instance to be verified on the private instance - no shared database needed.

---

## First-time setup walkthrough

### Step 1 - Request access (on the public instance)

1. Visit the public instance URL
2. Click **"New here? Get started"** on the login page
3. On the setup wizard, click **"Don't have a token yet? Request access"**
4. Fill out the request form - including the **email and password** you want to use as your management account
5. Submit - you'll receive a confirmation email

### Step 2 - Developer approves (on the public instance)

1. Developer receives an approval notification at `DEVELOPER_EMAIL`
2. Click the link → `/approve-request` page
3. Review the request details, click **"Approve & Send Token"**
4. A setup token is emailed to the requester
5. In development (`NODE_ENV=development`), the token is also printed to the server console

### Step 3 - Complete setup (on the private business instance)

1. Visit the private instance URL
2. The app detects it's uninitialized and redirects to `/setup`
3. Paste your setup token
4. Click Continue → fill in business name, timezone, currency
5. Click **"Set Up My Dashboard"**
6. You're redirected to the login page - sign in with the email and password you set in Step 1

---

## User roles

| Role | Access |
|---|---|
| **Operational** | Inventory, alerts, reorder tasks. For clerks and warehouse staff. |
| **Analytical** | Everything above + sales analytics, forecasts, model insights, reports. For analysts and planners. |
| **Management** | Everything above + settings, user management, admin. For business owners. |

Roles are hierarchical - higher tiers see everything lower tiers see, plus more. Tabs a role can't access are hidden, not greyed out.

---

## Adding users after setup

Additional users are invited by a Management account from the **Settings** screen. They receive an email with a link to set their own password. Management never sees or sets passwords for invited users.

Invite links expire after 72 hours. If a link expires before the user accepts, re-invite from Settings — a new link will be issued.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7 |
| Charts | Recharts |
| Icons | react-icons (Material Design set) |
| Styling | Plain CSS, CSS custom properties |
| Backend | Node.js 22+, Express |
| Database | SQLite via Node built-in `node:sqlite` |
| Auth | bcrypt, jsonwebtoken, httpOnly refresh token cookies |
| Email | Nodemailer (Resend SMTP or Ethereal in dev) |
| Forecasting | Django 6 + Django REST Framework (David's module, port 8000) |
| ML models | Naive, Moving Average, ARIMA, SARIMA, XGBoost — best selected per product line |

---
