# Physics AI Tutor

A full-stack, **strictly textbook-grounded** physics tutor built with **Next.js (App Router)** and a separate **Express + MongoDB** API. Students ask physics questions; the backend retrieves relevant passages from indexed textbook PDFs, sends only that context to the configured AI provider (Gemini by default, OpenAI optional), and returns answers with page-level citations.

## Highlights

- **Strict textbook-only RAG** — answers are generated only from retrieved textbook context. If nothing relevant is found, the tutor refuses instead of using outside knowledge.
- **Page-level citations** — each answer carries textbook title, page number, passage excerpt, and retrieval score.
- **Physics-native rendering** — React Markdown + KaTeX for equations.
- **Student accounts** — registration, login, secure HTTP-only cookie sessions, settings, password changes.
- **Conversation history** — thread list, per-conversation textbook scope, follow-up context.
- **Admin knowledge base** — PDF upload, background indexing with live progress, reindex, delete, usage analytics.
- **Cost optimization** — relevance threshold (no LLM call when nothing matches), answer caching, embedding reuse, context/token budgets, per-user daily limits, rate limiting.
- **Tested backend** — Vitest unit tests plus HTTP smoke tests.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide React, React Markdown, KaTeX |
| Backend | Node.js, Express 5, TypeScript, MongoDB, Mongoose |
| AI | Gemini API (`gemini-3.5-flash-lite` + `gemini-embedding-001`) by default; OpenAI optional, custom RAG pipeline |
| Vector storage | MongoDB chunk embeddings + cosine similarity (optional Atlas Vector Search) |
| Auth | bcrypt, JWT in an HTTP-only cookie, role-based access control |

## Project structure

```text
physics-ai-tutor/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                 # landing page
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── chat/                    # /chat and /chat/[id]
│   │   │   ├── settings/
│   │   │   └── admin/                   # dashboard and /admin/book
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── settings/
│   │   │   ├── sidebar/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── config/                      # env, MongoDB, AI provider clients
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── pdfService.ts
│   │   │   ├── embeddingService.ts
│   │   │   ├── retrievalService.ts
│   │   │   ├── ingestionService.ts
│   │   │   ├── aiService.ts
│   │   │   ├── geminiService.ts
│   │   │   ├── fileStorage.ts
│   │   │   ├── textbookService.ts
│   │   │   └── analyticsService.ts
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   └── package.json
├── scripts/
│   ├── dev.sh
│   └── start.sh
├── package.json
├── README.md
├── DEPLOYMENT.md
├── render.yaml
├── .gitignore
└── .env.example
```

The frontend and backend are **separate applications**. No Vite, no React Router — all frontend navigation uses the Next.js App Router. AI provider credentials live only in the backend environment.

## Quick start

### Prerequisites

- Node.js **20.19+**
- MongoDB **7+** running locally, or a MongoDB Atlas connection string
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/api-keys) (free tier available)
- Optional: an OpenAI API key if you prefer `AI_PROVIDER=openai`

If your MongoDB requires authentication, use a URI such as
`mongodb://user:password@localhost:27017/physics_ai_tutor?authSource=admin`
in `MONGODB_URI`.

### 1. Install

```bash
npm run setup
```

### 2. Configure

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Edit `backend/.env` and set at least:

- `GEMINI_API_KEY` (or `OPENAI_API_KEY` with `AI_PROVIDER=openai`)
- `JWT_SECRET` (generate with `openssl rand -hex 32`)
- `ADMIN_EMAILS` (your admin email)
- `MONGODB_URI` if MongoDB requires authentication

The frontend talks to Express through `NEXT_PUBLIC_API_URL` in
`frontend/.env.local`.

### 3. Run both apps

```bash
npm run dev
```

- Frontend: **http://localhost:3000**
- API: **http://localhost:5000** (change `PORT` and `NEXT_PUBLIC_API_URL` together if that port is already in use)

You can also run each app separately with `npm run dev` inside `backend/` and
`frontend/`.

### 4. Create an admin

Registration creates **student** accounts by default. To bootstrap an administrator, put your email in `ADMIN_EMAILS` before registering:

```env
ADMIN_EMAILS=you@university.edu,ta@university.edu
```

That email is promoted to `admin` at registration time. You can also promote an existing account in MongoDB:

```js
db.users.updateOne({ email: "you@university.edu" }, { $set: { role: "admin" } })
```

> Use a private, trusted address for admin bootstrap because there is no email-verification step.

### 5. Index a textbook

1. Sign in as an admin.
2. Open **http://localhost:3000/admin/book**.
3. Upload a text-based PDF, add a title, and submit.
4. Background indexing extracts page text, chunks it, embeds it, and stores it in MongoDB. The list polls progress automatically.
5. When status is **Ready**, students can ask questions in `/chat`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `5000` | Express port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/physics_ai_tutor` | MongoDB connection |
| `JWT_SECRET` | dev placeholder | **Must be changed in production** |
| `JWT_EXPIRES_IN` | `7d` | Session token lifetime |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed origin(s), comma-separated |
| `COOKIE_NAME` | `physics_token` | Auth cookie name |
| `COOKIE_SAMESITE` | `lax` | Use `none` + HTTPS for cross-site deployments |
| `COOKIE_DOMAIN` | unset | Optional shared cookie domain |
| `ADMIN_EMAILS` | empty | Comma-separated emails promoted to admin on registration |
| `AI_PROVIDER` | auto | `gemini` (default when `GEMINI_API_KEY` is set) or `openai` |
| `GEMINI_API_KEY` | unset | Server-only Gemini credential |
| `GEMINI_CHAT_MODEL` | `gemini-3.5-flash-lite` | Gemini text model |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Gemini embedding model |
| `GEMINI_EMBEDDING_DIMENSIONS` | `768` | Must match the model output |
| `GEMINI_MAX_OUTPUT_TOKENS` | `2048` | Answer length cap (includes thinking tokens) |
| `OPENAI_API_KEY` | unset | Optional OpenAI credential |
| `OPENAI_CHAT_MODEL` | `gpt-4.1-mini` | Optional OpenAI Responses API model |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Optional OpenAI embedding model |
| `OPENAI_EMBEDDING_DIMENSIONS` | `1536` | Must match the OpenAI model output |
| `OPENAI_MAX_OUTPUT_TOKENS` | `900` | Optional OpenAI answer length cap |
| `OPENAI_TEMPERATURE` | `0.2` | Optional OpenAI creativity setting |
| `RETRIEVAL_TOP_K` | `6` | Passages retrieved per question |
| `RETRIEVAL_MIN_SCORE` | `0.25` | Cosine-similarity floor; below it the tutor refuses without calling the LLM |
| `RETRIEVAL_MAX_CHUNKS` | `50000` | Safety cap for in-process similarity |
| `MAX_CONTEXT_CHARS` | `14000` | Context budget sent to the model |
| `ANSWER_CACHE_TTL_DAYS` | `7` | Repeated first-question cache lifetime |
| `CHAT_INPUT_COST_PER_MILLION` | `0.4` | Cost estimate rate (USD / 1M input tokens) |
| `CHAT_OUTPUT_COST_PER_MILLION` | `1.6` | Cost estimate rate (USD / 1M output tokens) |
| `EMBEDDING_COST_PER_MILLION` | `0.02` | Cost estimate rate (USD / 1M embedding tokens) |
| `DAILY_MESSAGE_LIMIT` | `100` | Default per-student daily question limit |
| `MAX_PDF_MB` | `30` | PDF upload size cap |
| `ENABLE_ATLAS_VECTOR_SEARCH` | `false` | Use Atlas `$vectorSearch` instead of in-process cosine |
| `ATLAS_VECTOR_INDEX` | `vector_index` | Atlas vector index name |

> Cost rates are estimates. Update them if your model pricing differs. Usage is tracked but billing is not authoritative.

### Frontend (`frontend/.env.local`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Express API base URL |

Only public configuration belongs in `NEXT_PUBLIC_*` variables. Never place `GEMINI_API_KEY` or `OPENAI_API_KEY` in the frontend.

## How the RAG pipeline works

1. **Upload** — admin uploads a PDF; the original file is stored in MongoDB GridFS so it survives restarts and redeploys.
2. **Extraction** — `pdfService` uses `pdf-parse` to read text per page, preserving page numbers for citations.
3. **Chunking** — page-aware, sentence-boundary sliding windows with overlap. Every chunk remembers its page; very short tails are ignored.
4. **Embedding** — chunks are embedded with the configured provider (`gemini-embedding-001`, 768 dims, by default) in batches. Identical content hashes reuse existing embeddings, so reindexing the same book is nearly free.
5. **Storage** — chunks and embeddings live in MongoDB. Embeddings are excluded from API responses by default.
6. **Retrieval** — the question is embedded, then compared against indexed chunks (in-process cosine similarity, or Atlas `$vectorSearch` when enabled). Results below `RETRIEVAL_MIN_SCORE` are discarded.
7. **Strict generation** — only retrieved passages are sent to the configured chat model, with instructions to answer solely from context and cite `[Source n]`.
8. **Refusal path** — if no passage clears the threshold, **no chat model call is made**. The API returns the refusal message.
9. **Citation fallback** — if the model omits citation markers, the backend appends a source list from the passages actually sent.
10. **Persistence** — messages, citations, token usage, and estimated cost are stored for history and analytics.

### Optional: MongoDB Atlas Vector Search

For larger corpora, set `ENABLE_ATLAS_VECTOR_SEARCH=true` and create an Atlas Search vector index on the `chunks` collection:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "textbookId" }
  ]
}
```

Name the index `vector_index` or override `ATLAS_VECTOR_INDEX`. If Atlas search fails, the backend automatically falls back to in-process cosine similarity.

## API overview

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | public | Health and DB status |
| `POST` | `/api/auth/register` | public | Create student account |
| `POST` | `/api/auth/login` | public | Sign in and set cookie |
| `POST` | `/api/auth/logout` | public | Clear cookie |
| `GET` | `/api/auth/me` | auth | Current user |
| `PATCH` | `/api/auth/me` | auth | Update name/email |
| `PATCH` | `/api/auth/me/password` | auth | Change password |
| `GET` | `/api/textbooks` | auth | Ready textbooks for chat scope |
| `GET` | `/api/conversations` | auth | List own conversations |
| `POST` | `/api/conversations` | auth | Create conversation |
| `GET` | `/api/conversations/:id` | auth | Conversation + messages |
| `PATCH` | `/api/conversations/:id` | auth | Rename or change scope |
| `DELETE` | `/api/conversations/:id` | auth | Delete conversation |
| `POST` | `/api/chat` | auth | Ask a question and get a grounded answer |
| `GET` | `/api/admin/stats` | admin | Usage and content analytics |
| `GET` | `/api/admin/users` | admin | List users |
| `PATCH` | `/api/admin/users/:id` | admin | Change role / daily limit |
| `GET` | `/api/admin/textbooks` | admin | All textbooks with status |
| `POST` | `/api/admin/textbooks` | admin | Upload PDF (`multipart/form-data`, field `file`) |
| `POST` | `/api/admin/textbooks/:id/reindex` | admin | Re-run indexing |
| `DELETE` | `/api/admin/textbooks/:id` | admin | Delete textbook and chunks |

Authenticated browser requests use `credentials: "include"` with the HTTP-only cookie.

## Cost optimization

- **No chat-completion cost on refusal** when retrieval produces no passage above the threshold (only the small query-embedding call is made).
- **Answer cache** for repeated first-turn questions (TTL configurable).
- **Embedding reuse** via SHA-256 content hashes, including across reindexes.
- **Small context window** (`RETRIEVAL_TOP_K`, `MAX_CONTEXT_CHARS`).
- **Output cap** with `OPENAI_MAX_OUTPUT_TOKENS`.
- **Daily quotas** per student plus IP rate limiting.
- **Usage tracking** with estimated cost shown in the admin dashboard.

## Testing and quality checks

From the repository root:

```bash
npm run check   # backend + frontend typecheck, backend tests
npm run build   # production builds for both apps
```

Or run individual commands inside each app.

Tests cover page-aware chunking (including long-paragraph coverage), cosine similarity, strict-grounding prompt helpers, citation fallback, refusal detection, cost estimates, health check, 404 handling, and unauthenticated access rejection. AI provider calls are not made in tests.

## Production run

1. Set `NODE_ENV=production` in `backend/.env`.
2. Set a strong `JWT_SECRET`, your production `MONGODB_URI`, `FRONTEND_URL`, and `GEMINI_API_KEY` (or `AI_PROVIDER=openai` with `OPENAI_API_KEY`).
3. Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to the public API URL, then build.
4. Run:

```bash
npm run build
npm start
```

For local HTTP demos, keep `NODE_ENV=development` because production cookies are
`Secure` and require HTTPS. In production, serve both apps behind HTTPS and set
`COOKIE_SAMESITE=none` only if the frontend and API are on different sites.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Render + Vercel + MongoDB Atlas setup.

## Production notes

- Set a strong `JWT_SECRET`; the server refuses to boot in production with the development secret.
- Serve both apps over HTTPS. If frontend and API are on different sites, set `COOKIE_SAMESITE=none` (requires `secure` cookies) and add both origins to `FRONTEND_URL`.
- PDFs are stored in MongoDB GridFS; no persistent disk is required.
- The backend trusts one proxy hop in production (`trust proxy = 1`) for correct rate-limit IPs.
- Uploaded PDFs are **not** served publicly; only admin uploads and student chat endpoints access them.
- Scanned/image-only PDFs are rejected because OCR is not included. Run OCR before uploading.
- Model names and prices change; update `GEMINI_CHAT_MODEL`, `GEMINI_EMBEDDING_MODEL`, and the cost-rate variables as needed. Gemini free-tier usage is recorded with zero estimated cost.
- The app is designed for a single-node API. For horizontal scaling, add a shared rate-limit store and queue-based ingestion.

## License

Private project scaffold. Add a license before distributing.
