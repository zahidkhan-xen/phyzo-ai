---
title: Phyzo AI API
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Phyzo AI API

Express API for the Phyzo AI Tutor. This Space builds the backend directly from:

https://github.com/zahidkhan-xen/phyzo-ai

## Required Space secrets

Add these under **Settings → Variables and secrets**:

- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — long random string
- `FRONTEND_URL` — `https://phyzo-ai.vercel.app`
- `ADMIN_EMAILS` — admin email address
- `GEMINI_API_KEY` — Google AI Studio key

The Dockerfile already sets:

- `NODE_ENV=production`
- `PORT=7860`
- `AI_PROVIDER=gemini`
- `GEMINI_CHAT_MODEL=gemini-3.5-flash-lite`
- `GEMINI_EMBEDDING_MODEL=gemini-embedding-001`
- `GEMINI_EMBEDDING_DIMENSIONS=768`
- `COOKIE_SAMESITE=none`

Add these as Space variables too if needed:

- `GEMINI_MAX_OUTPUT_TOKENS=2048`
- `MAX_PDF_MB=30`
- `DAILY_MESSAGE_LIMIT=100`
- `ENABLE_ATLAS_VECTOR_SEARCH=false`

## Notes

- Free CPU Spaces sleep after 48 hours without traffic; the next request wakes the Space.
- PDFs are stored in MongoDB GridFS, so no persistent disk is needed.
