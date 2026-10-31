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
EXPOSE 7860

CMD ["npm", "start"]
