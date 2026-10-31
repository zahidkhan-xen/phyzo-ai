FROM node:20-slim

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --include=dev

COPY backend/ ./
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=8080
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

EXPOSE 8080

CMD ["npm", "start"]
