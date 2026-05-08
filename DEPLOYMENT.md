# Deployment Guide

This project is prepared for user-testing deployment with:

- Backend: Railway service with root directory `/backend`
- Database: Railway PostgreSQL
- Frontend: Vercel project with root directory `/frontend`
- Local development: SQLite remains supported

## Railway Backend

1. Create a new Railway project.
2. Add a PostgreSQL database to the project.
3. Add a new service from the GitHub repository.
4. Set the service root directory to `/backend`.
5. Confirm the start command:

```bash
python manage.py migrate && python manage.py collectstatic --noinput && gunicorn site_engineer_system.wsgi:application --bind 0.0.0.0:$PORT
```

6. Add the Railway backend environment variables:

```env
DEBUG=False
SECRET_KEY=replace-with-a-real-secret
DB_ENGINE=postgresql
DATABASE_URL=${{Postgres.DATABASE_URL}}
ALLOWED_HOSTS=.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app,https://your-backend.up.railway.app
```

7. Deploy the service.
8. Open `https://your-backend.up.railway.app/api/health/` and confirm:

```json
{"status": "ok"}
```

9. Create an admin user from the Railway shell:

```bash
python manage.py createsuperuser
```

## Railway PostgreSQL

Railway provides `DATABASE_URL` from the PostgreSQL service. The backend prefers `DATABASE_URL` when it exists. If you cannot use `DATABASE_URL`, set these instead:

```env
DB_ENGINE=postgresql
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
```

## Vercel Frontend

1. Import the GitHub repository into Vercel.
2. Set root directory to `/frontend`.
3. Set framework preset to `Vite`.
4. Use install command `npm install`.
5. Use build command `npm run build`.
6. Use output directory `dist`.
7. Add the frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
```

8. Deploy the project.
9. Open the Vercel domain and log in.

## Local Development

Backend with SQLite:

```bash
cd backend
copy .env.local.example .env
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Frontend:

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

## Common Issues

### CORS Error

Add the exact Vercel origin to Railway:

```env
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

Do not add a trailing slash.

### CSRF Error

Add both frontend and backend HTTPS origins to Railway:

```env
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app,https://your-backend.up.railway.app
```

### Static Files Missing

Confirm the Railway start command includes:

```bash
python manage.py collectstatic --noinput
```

WhiteNoise serves files from `backend/staticfiles`.

### Admin CSS Missing

This is usually the same static-file issue. Redeploy after confirming `collectstatic` runs successfully.

### Vercel Refresh 404

Confirm `frontend/vercel.json` exists and includes the SPA rewrite to `/index.html`.

### Database Migration Not Applied

The Railway start command runs:

```bash
python manage.py migrate
```

If a deploy started before the database was attached, redeploy after `DATABASE_URL` is available.

### SQLite Accidentally Used In Production

On Railway, set:

```env
DB_ENGINE=postgresql
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

If `DATABASE_URL` is missing and `DB_ENGINE` is not `postgresql`, the backend falls back to local SQLite.

### Media Uploads Not Persisting

Railway app filesystems are ephemeral. Uploaded media in `backend/media` may disappear between deploys. For persistent production uploads, add object storage such as S3-compatible storage before relying on user-uploaded files.
