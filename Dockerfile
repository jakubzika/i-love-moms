# Mother's Day Card — Next.js standalone build for Dokploy / any container host.
#
# We build the whole repo as-is. The chat surface and the mastra-backed
# /api/copilotkit route are present in the bundle but unused: the index
# page no longer links to them, and unset env vars make the agent route
# return errors if anybody finds it. No source deletion, no surprises.

# ─── Stage 1: build ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Use pnpm via corepack (project has pnpm-lock.yaml).
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# next.config.ts already sets `output: "standalone"`.
RUN pnpm run build

# ─── Stage 2: runtime ───────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output bundles the minimum node_modules it needs.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
