# Deployment: Render + Vercel + MongoDB Atlas

This setup uses:

- **Render** for the Express API (`backend/`)
- **Vercel** for the Next.js frontend (`frontend/`)
- **MongoDB Atlas** free tier for the database and GridFS PDF storage
- **Gemini free tier** for chat and embeddings

PDFs are stored in MongoDB GridFS, so the backend does not need a persistent disk.

## 1. Create the MongoDB Atlas database

1. Create a free **M0** cluster at https://www.mongodb.com/cloud/atlas.
2. Create a database user with read/write access.
3. Under **Network Access**, allow access from anywhere: `0.0.0.0/0`.
4. Copy the connection string and add the database name:

```text
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/physics_ai_tutor?retryWrites=true&w=majority
```

## 2. Deploy the backend on Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository.
3. Render reads `render.yaml` and creates `physics-ai-tutor-api`.
4. Fill the secret environment variables when prompted:
   - `MONGODB_URI` — Atlas connection string
   - `GEMINI_API_KEY` — free key from https://aistudio.google.com/api-keys
   - `ADMIN_EMAILS` — your admin email
   - `FRONTEND_URL` — temporarily `http://localhost:3000`; update after Vercel deploys
5. Deploy and wait for `/api/health` to return `{"status":"ok"}`.
6. Copy the Render URL, for example:

```text
https://physics-ai-tutor-api.onrender.com
```

If you prefer manual setup instead of the Blueprint, create a **Web Service** with:

- Root directory: `backend`
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

## 3. Deploy the frontend on Vercel

1. In Vercel, import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Add an environment variable before deploying:

```text
NEXT_PUBLIC_API_URL=https://physics-ai-tutor-api.onrender.com/api
```

4. Deploy and copy the Vercel URL, for example:

```text
https://physics-ai-tutor.vercel.app
```

`NEXT_PUBLIC_API_URL` is baked into the frontend at build time. If the Render URL changes, update it in Vercel and redeploy.

## 4. Connect the two services

In Render, update:

```text
FRONTEND_URL=https://physics-ai-tutor.vercel.app
```

Then redeploy the backend. This allows the Vercel origin through CORS.

The backend uses `COOKIE_SAMESITE=none` and `NODE_ENV=production`, so auth cookies are `Secure` and work across the two HTTPS domains.

## 5. Create the admin account

1. Open the Vercel URL and go to `/register`.
2. Register using the exact email in `ADMIN_EMAILS`.
3. The account is promoted to admin automatically.
4. Open `/admin/book`, upload the Physics PDF, and wait for **Ready**.
5. Ask a question from `/chat`.

## 6. Verify

```bash
curl https://physics-ai-tutor-api.onrender.com/api/health
```

Expected:

```json
{"status":"ok","database":"connected","timestamp":"..."}
```

## Free-tier notes

- Render free services sleep after inactivity; the first request may take a while.
- If indexing is interrupted by a restart, the textbook is marked failed and can be reindexed.
- Gemini free tier has rate limits. A `429` or `503` means wait and retry.
- Atlas M0 has limited storage. GridFS PDFs and embeddings count toward it.
- Vercel and Render both provide HTTPS, which is required for `SameSite=None` cookies.

## Optional: custom domain

1. Add the domain in Vercel and Render.
2. Point DNS records as instructed by each provider.
3. Update `FRONTEND_URL` in Render to the custom frontend origin.
4. Update `NEXT_PUBLIC_API_URL` in Vercel to the custom API URL and redeploy.
