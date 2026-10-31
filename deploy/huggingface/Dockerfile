FROM node:20-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG REPO_URL=https://github.com/zahidkhan-xen/phyzo-ai.git
RUN git clone --depth 1 "$REPO_URL" .

WORKDIR /app/backend

RUN npm ci --include=dev
RUN npm run build

ENV NODE_ENV=production
ENV PORT=7860
ENV AI_PROVIDER=gemini
ENV GEMINI_CHAT_MODEL=gemini-3.5-flash-lite
ENV GEMINI_EMBEDDING_MODEL=gemini-embedding-001
ENV GEMINI_EMBEDDING_DIMENSIONS=768
ENV GEMINI_MAX_OUTPUT_TOKENS=2048
ENV COOKIE_NAME=physics_token
ENV COOKIE_SAMESITE=none
ENV MAX_PDF_MB=30
ENV DAILY_MESSAGE_LIMIT=100
ENV ENABLE_ATLAS_VECTOR_SEARCH=false
EXPOSE 7860

CMD ["npm", "start"]
