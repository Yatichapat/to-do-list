# To-Do List Project

## Seed Demo Data

Run these commands from the backend folder:

```bash
python3 manage.py migrate
python3 manage.py seed_demo_data
```

Demo credentials:

- Username: `demo`
- Password: `Demo1234!`

This command creates/updates:

- users: `demo`, `reviewer`
- categories for demo user: `Work`, `Personal`, `Study`
- sample tasks (pending, in-progress, completed)

You can run `seed_demo_data` multiple times safely.
