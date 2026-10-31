# Deployment: Back4App + Vercel + MongoDB Atlas

This setup uses:

- **Back4App Containers** (free, no credit card) for the Express API
- **Vercel** for the Next.js frontend
- **MongoDB Atlas** free tier for the database and GridFS PDF storage
- **Gemini free tier** for chat and embeddings

PDFs are stored in MongoDB GridFS, so the backend does not need a persistent disk.

## Current deployment

- Frontend: https://phyzo-ai.vercel.app
- Repository: https://github.com/zahidkhan-xen/phyzo-ai
- Backend: pending Back4App deployment

## 1. Create the MongoDB Atlas database

1. Create a free **M0** cluster at https://www.mongodb.com/cloud/atlas.
2. Create a database user with read/write access.
3. Under **Network Access**, allow access from anywhere: `0.0.0.0/0`.
4. Copy the connection string and add the database name:

```text
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/physics_ai_tutor?retryWrites=true&w=majority
```

## 2. Deploy the backend on Back4App Containers

1. Push this repository to GitHub.
2. Sign up at https://www.back4app.com/signup-containers using GitHub (no card).
3. Create a new **Containers** app and connect `zahidkhan-xen/phyzo-ai`.
4. Use the repository root and the root `Dockerfile`.
5. Add these environment variables:
   - `MONGODB_URI` — Atlas connection string
   - `GEMINI_API_KEY` — free key from https://aistudio.google.com/api-keys
   - `ADMIN_EMAILS` — `admin@physics.local`
   - `FRONTEND_URL` — `https://phyzo-ai.vercel.app`
   - `JWT_SECRET` — a long random string
6. Deploy and wait for `/api/health` to return `{"status":"ok"}`.
7. Copy the Back4App URL, for example:

```text
https://phyzo-ai-api.b4a.run
```

The root `Dockerfile` already sets the Gemini models, cookie settings, and port `8080`.

## 3. Deploy the frontend on Vercel

1. In Vercel, import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Add an environment variable before deploying (already set for the current project):

```text
NEXT_PUBLIC_API_URL=https://phyzo-ai-api.b4a.run/api
```

4. Deploy and copy the Vercel URL, for example:

```text
https://physics-ai-tutor.vercel.app
```

`NEXT_PUBLIC_API_URL` is baked into the frontend at build time. If the Render URL changes, update it in Vercel and redeploy.

## 4. Connect the two services

In Back4App, make sure:

```text
FRONTEND_URL=https://phyzo-ai.vercel.app
```

This allows the Vercel origin through CORS.

The backend uses `COOKIE_SAMESITE=none` and `NODE_ENV=production`, so auth cookies are `Secure` and work across the two HTTPS domains.

## 5. Create the admin account

1. Open the Vercel URL and go to `/register`.
2. Register using the exact email in `ADMIN_EMAILS`.
3. The account is promoted to admin automatically.
4. Open `/admin/book`, upload the Physics PDF, and wait for **Ready**.
5. Ask a question from `/chat`.

## 6. Verify

```bash
curl https://phyzo-ai-api.b4a.run/api/health
```

Expected:

```json
{"status":"ok","database":"connected","timestamp":"..."}
```

## Free-tier notes

- Back4App free containers sleep after inactivity; the first request may take a while.
- If indexing is interrupted by a restart, the textbook is marked failed and can be reindexed.
- Gemini free tier has rate limits. A `429` or `503` means wait and retry.
- Atlas M0 has limited storage. GridFS PDFs and embeddings count toward it.
- Vercel and Back4App both provide HTTPS, which is required for `SameSite=None` cookies.

## Optional: custom domain

1. Add the domain in Vercel and Back4App.
2. Point DNS records as instructed by each provider.
3. Update `FRONTEND_URL` in Back4App to the custom frontend origin.
4. Update `NEXT_PUBLIC_API_URL` in Vercel to the custom API URL and redeploy.
