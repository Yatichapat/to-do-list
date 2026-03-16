# To-Do List

## Environment Setup

Before running the project, create and edit these 2 files:

1. `backend/.env`
2. `frontend/.env.local`

Example `backend/.env`:

```env
SECRET_KEY=django-insecure-development-key-change-in-production
DEBUG=True
DB_NAME=todo_db
DB_USER=todo_user
DB_PASSWORD=todo_password
DB_HOST=localhost
DB_PORT=5432

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Example `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Notes:
- Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` only if you want Google login.
- Set `DB_HOST=db` only when the backend runs inside Docker Compose.

## Quick Start

1. Start database and app with Docker:

```bash
docker compose up --build
```

2. Seed demo data:

- If backend is running in Docker:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo_data
```

- If running backend locally from `backend/` directory:

```bash
python3 manage.py migrate
python3 manage.py seed_demo_data
```

Demo user:
- Username: `demo`
- Password: `Demo1234!`

## API Quick Test

1. Login to get token:

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
	-H "Content-Type: application/json" \
	-d '{"username":"demo","password":"Demo1234!"}'
```

2. Use returned `access` token:

```bash
TOKEN="YOUR_ACCESS_TOKEN"
curl http://127.0.0.1:8000/api/tasks/ \
	-H "Authorization: Bearer $TOKEN"
```

## Frontend

- App: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:8000/api`

## Production Deployment (Railway + Vercel)

Backend (Railway) environment variables:

```env
DEBUG=False
SECRET_KEY=<generate-a-long-random-secret>
ALLOWED_HOSTS=<your-railway-domain>.up.railway.app
CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>.vercel.app
CSRF_TRUSTED_ORIGINS=https://<your-vercel-domain>.vercel.app

# Railway Postgres provides DATABASE_URL automatically.
# If you are not using Railway Postgres, set DB_NAME/DB_USER/DB_PASSWORD/DB_HOST/DB_PORT.
```

Frontend (Vercel) environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://<your-railway-domain>.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<optional>
```

Deployment notes:
- Backend serves with Gunicorn and runs `migrate` + `collectstatic` on container start.
- To auto-seed demo data on startup, set `RUN_SEED_DATA=true` in backend environment variables.
- To seed only the first time (recommended), set `RUN_SEED_DATA=once`.
- Keep `CORS_ALLOW_ALL_ORIGINS` disabled in production and use `CORS_ALLOWED_ORIGINS` instead.
- If you use a custom domain, add that domain to `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
