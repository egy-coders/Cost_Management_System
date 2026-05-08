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
5. Keep the service on the Dockerfile builder. The repo's `backend/railway.json` sets this explicitly and clears any dashboard build command override.
6. Confirm the start command:

```bash
python railway_start.py
```

7. Confirm the pre-deploy command:

```bash
python railway_predeploy.py
```

8. Set the healthcheck path to `/api/health/`.
9. Add the Railway backend environment variables:

```env
DEBUG=False
SECRET_KEY=replace-with-a-real-secret
PORT=8000
DB_ENGINE=postgresql
DATABASE_URL=${{Postgres.DATABASE_URL}}
ALLOWED_HOSTS=.railway.app,.up.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app,https://your-backend.up.railway.app
```

10. Deploy the service.
11. Open `https://your-backend.up.railway.app/api/health/` and confirm:

```json
{"status": "ok"}
```

12. Create an admin user from the Railway shell:

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

Static files are collected during Railway pre-deploy:

```bash
python railway_predeploy.py
```

WhiteNoise serves files from `backend/staticfiles`.

### Railway Healthcheck Fails

Use `/api/health/` as the healthcheck path. It is a lightweight JSON endpoint and avoids admin/session/static-file behavior during startup. Keep migrations in `preDeployCommand` and keep the start command to Gunicorn only, so the web server binds its port immediately during the healthcheck window. If the Railway domain target port is set to `8000`, add `PORT=8000` in the service variables so Gunicorn, the public domain, and Railway's healthcheck all use the same port. Also confirm local files such as `backend/.env` and `backend/db.sqlite3` are not included in the Docker image.

### Admin CSS Missing

This is usually the same static-file issue. Redeploy after confirming `collectstatic` runs successfully.

### Vercel Refresh 404

Confirm `frontend/vercel.json` exists and includes the SPA rewrite to `/index.html`.

### Database Migration Not Applied

The Railway pre-deploy command runs migrations and static collection:

```bash
python railway_predeploy.py
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
