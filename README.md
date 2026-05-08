# Site Engineer Cost Management System

Phase 1 MVP for replacing construction project cost tracking spreadsheets with a web-based management system for site engineers, project managers, accountants, and management viewers.

## Features

- JWT login, refresh, logout, and current-user API
- Role-based backend permissions and role-aware frontend navigation
- Projects, project members, vendors, and cost categories
- Expense creation with backend VAT/total calculation
- Approval workflow: draft, submitted, approved, rejected
- Payments with automatic paid, pending, and payment status recalculation
- Cash-in/client payments
- Attachments for expenses, payments, and cash-in documents
- Dashboard KPIs and charts from database records
- Reports with filters plus Excel and PDF export
- RAK branding across favicon, login, sidebar/header, loading/empty states, dashboard, and report exports
- English/Arabic i18n with RTL layout, localized API errors, and localized report export
- Django admin, migrations, seed command, and backend tests

## Tech Stack

Backend: Python, Django, Django REST Framework, PostgreSQL, Simple JWT, django-filter, openpyxl, ReportLab.

Frontend: React, TypeScript, Tailwind CSS, React Router, React Query, Recharts, Axios, lucide-react, i18next, react-i18next.

Dev/deployment: Docker, Docker Compose, environment variables.

## Docker Setup

1. Copy environment defaults:

```bash
cp .env.example .env
```

2. Start the stack:

```bash
docker compose up --build
```

3. Open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Django admin: http://localhost:8000/admin/

The backend container runs migrations and seeds Phase 1 sample data on startup.

## Run Locally with SQLite

This setup is for quick development without Docker or PostgreSQL. It keeps the Docker/PostgreSQL setup intact for staging and production.

Backend:

```bash
cd backend
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
copy .env.local.example .env
```

Linux/Mac:

```bash
source venv/bin/activate
cp .env.local.example .env
```

Install dependencies and prepare the SQLite database:

```bash
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_phase1
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

Frontend:

```bash
cd frontend
npm install
```

Windows:

```bash
copy .env.local.example .env.local
```

Linux/Mac:

```bash
cp .env.local.example .env.local
```

Run the frontend:

```bash
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:8000/api
- Django admin: http://127.0.0.1:8000/admin

## Default Seed Users

All seed users use password `Password123!`.

- Admin: `admin@example.com`
- Site Engineer: `engineer@example.com`
- Project Manager: `pm@example.com`
- Accountant / Finance: `accountant@example.com`
- Management Viewer: `viewer@example.com`

## Internationalization

Supported languages:

- English (`en`) is the default and fallback language.
- Arabic (`ar`) supports RTL layout, Arabic labels, and localized number/date/currency formatting.

Frontend translations live in:

```text
frontend/src/i18n/
  index.ts               i18next setup, language detection, lang/dir handling
  format.ts              Intl-based number, date, percentage, and currency helpers
  locales/en/*.json      English namespaces
  locales/ar/*.json      Arabic namespaces
```

The language switcher is available in the app header and login screen. It stores the current language in `localStorage` under `preferredLanguage`, updates `<html lang>` and `<html dir>` immediately, and saves the authenticated user's `preferred_language` through `PATCH /api/auth/me/`.

Backend translations live in:

```text
backend/locale/
  en/LC_MESSAGES/django.po
  ar/LC_MESSAGES/django.po
```

The API resolves language in this order for authenticated requests:

1. User `preferred_language`
2. `lang` or `language` query parameter
3. `Accept-Language` request header
4. English fallback

For JWT API calls, the custom authentication class activates the saved user language before serializers and service validation run. Frontend Axios sends the active `Accept-Language` header automatically.

Reports localize Excel/PDF titles, headers, dates, numbers, and RTL sheet/table direction. Arabic PDF shaping uses `arabic-reshaper` and `python-bidi` from `backend/requirements.txt`, with ReportLab font fallback for Arabic-capable fonts.

## Branding Assets

RAK branding assets are organized in:

```text
frontend/public/
  favicon.ico
  brand/rak-logo.png
  brand/rak-icon.png
  brand/rak-icon-192.png
  brand/rak-icon-512.png
  site.webmanifest
backend/static/branding/
  rak-logo.png
```

The frontend uses these assets for the browser favicon, mobile icons, login screen, sidebar/header identity, dashboard welcome area, loading spinner, and empty states. The backend report service uses `backend/static/branding/rak-logo.png` in Excel and PDF export headers.

To replace branding later, keep the same filenames for a drop-in update, or adjust `frontend/src/components/branding/BrandLogo.tsx`, `frontend/index.html`, `frontend/public/site.webmanifest`, and `backend/apps/reports/services.py`. Brand colors are configured in `frontend/tailwind.config.js`; PDF/Excel export colors are defined near the top of `backend/apps/reports/services.py`.

Translation maintenance:

```bash
cd backend
python manage.py makemessages -l ar -l en
python manage.py compilemessages
```

On Windows, `compilemessages` requires GNU gettext (`msgfmt`) on PATH. The repository includes compiled `.mo` files for the current Arabic/English catalogs.

## Add a New Language

1. Add frontend JSON files under `frontend/src/i18n/locales/<code>/` using the same namespace filenames as `en` and `ar`.
2. Register the language in `frontend/src/i18n/index.ts`.
3. Add a language switcher option in `supportedLanguages`.
4. Add the backend language to `LANGUAGES` in `backend/site_engineer_system/settings.py`.
5. Add the user-language choice in `backend/apps/accounts/models.py` and create a migration if the supported set changes.
6. Generate backend messages with `python manage.py makemessages -l <code>`, translate `django.po`, then run `python manage.py compilemessages`.
7. Check RTL needs. For RTL languages, add the code to the frontend/backend RTL helpers and verify tables, forms, sidebar, charts, and report exports.

## Local Setup Without Docker

For PostgreSQL without Docker, set `DB_ENGINE=postgresql` plus `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in `backend/.env`, or provide `DATABASE_URL`. Then run the same backend commands.

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_phase1
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Tests

Backend:

```bash
cd backend
python manage.py test
```

Frontend build check:

```bash
cd frontend
npm run build
```

## Export Reports

Use the Reports page or call:

- `/api/reports/export/excel/?report=project-summary`
- `/api/reports/export/pdf/?report=project-summary`

Supported report names: `project-summary`, `monthly-cost`, `category-cost`, `vendor-statement`, `pending-payments`, `cash-flow`.

## Folder Structure

```text
backend/
  apps/accounts/      users, roles, JWT helpers
  apps/projects/      projects, members, vendors, categories, seed command
  apps/finance/       expenses, payments, cash-in, workflow services
  apps/attachments/   upload/download validation
  apps/dashboard/     KPI and chart aggregation
  apps/reports/       database reports and exports
  apps/audit/         approval logs
frontend/
  src/api/            Axios client
  src/components/     layout and reusable UI
  src/hooks/          auth context
  src/i18n/           frontend translations and locale formatting helpers
  src/pages/          dashboard and module pages
docs/API.md           endpoint overview
```

## Phase 1 Notes

This is a clean modular monolith, not microservices. Future hardening should add richer project-member administration in the frontend, finer attachment object permission checks, production static hosting, frontend unit tests, and deeper audit coverage for every model update.
