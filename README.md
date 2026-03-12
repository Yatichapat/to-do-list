# To-Do List

## Quick Start

1. Start database and app with Docker:

```bash
docker compose up --build
```

2. Seed demo data (from `backend/`):

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
