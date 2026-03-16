# Frontend (Next.js)

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Create environment file from template:

```bash
cp .env.local.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

## Deploy to Vercel

1. Import this repository in Vercel.
2. Set Root Directory to `frontend`.
3. Keep defaults for commands:
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `.next`

4. Add environment variables in Vercel Project Settings:

```env
NEXT_PUBLIC_API_BASE_URL=https://<your-railway-domain>.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
```

5. Redeploy.

## Notes

- `NEXT_PUBLIC_API_BASE_URL` is required in production. Build/runtime will fail fast if missing.
- Backend CORS/CSRF on Railway must include your Vercel domain.
