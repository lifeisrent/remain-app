# ─────────────────────────────────────
# Remain App — Dockerfile
# Multi-stage: build client, then serve
# ─────────────────────────────────────

# Stage 1: Build React client
FROM node:22-alpine AS builder
WORKDIR /app

# Install client deps and build
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client ./client
RUN cd client && npm run build
# Output: /app/client/../server/public  (vite.config.js: outDir: ../server/public)


# Stage 2: Production server
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install server deps only
COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server ./
# Copy built client
COPY --from=builder /app/server/public ./public

EXPOSE 3001

CMD ["node", "index.js"]
