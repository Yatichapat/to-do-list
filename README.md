# To-Do List

## Live Demo

You can access the deployed app directly:

- Frontend (Vercel): https://to-do-list-eight-bice-25.vercel.app
- Backend API (Railway): https://to-do-list-production-affb.up.railway.app
- Protected API endpoint: https://to-do-list-production-affb.up.railway.app/api/stats/

Use these links without running local setup.

Note:
- `/api/stats/` requires JWT authentication.
- If you open it directly in browser, you will see: `Authentication credentials were not provided.`

Quick test with token:

```bash
# 1) Login to get JWT token
curl -X POST https://to-do-list-production-affb.up.railway.app/api/login/ \
	-H "Content-Type: application/json" \
	-d '{"username":"demo","password":"Demo1234!"}'

# 2) Use access token with /api/stats/
curl https://to-do-list-production-affb.up.railway.app/api/stats/ \
	-H "Authorization: Bearer <ACCESS_TOKEN>"
```

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

