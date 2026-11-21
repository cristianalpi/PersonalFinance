# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# npm ci installs exactly what package-lock.json pins (reproducible builds).
RUN npm ci
COPY . .

# Next.js inlines every NEXT_PUBLIC_* variable into the bundle at build time (also in the server code and the
# proxy): each one must arrive here as a build arg, or the app behaves as if it were not set. Add any new
# NEXT_PUBLIC_* variable to this list.
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Bogotá time (UTC-5, no DST) for anything on the server that calls new Date().
RUN apk add --no-cache tzdata
ENV TZ=America/Bogota NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# output: "standalone" (next.config.ts) leaves a server with only the files it needs; the static assets and
# public/ are copied next to it so server.js serves them too. .next is writable for the runtime cache.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Run as the unprivileged user shipped with the Node image, never as root.
USER node

EXPOSE 3000

# The platform only routes traffic to the new container once this passes, so a broken release never
# replaces a working one.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "server.js"]
