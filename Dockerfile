# ============================================================
# SoroStream — multi-stage Dockerfile
# ============================================================
# Stage 1 — deps    : install production + dev dependencies
# Stage 2 — builder : compile the Next.js app
# Stage 3 — runner  : lean production image (~200 MB)
# ============================================================

# ---- Stage 1: install dependencies -------------------------
FROM node:20-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# for why libc6-compat is needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts


# ---- Stage 2: build the application ------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_ variables are inlined at build time.
# Pass them as build args so docker build --build-arg works.
ARG NEXT_PUBLIC_STELLAR_NETWORK=testnet
ARG NEXT_PUBLIC_CONTRACT_ID
ARG NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org

ENV NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK \
    NEXT_PUBLIC_CONTRACT_ID=$NEXT_PUBLIC_CONTRACT_ID \
    NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL \
    # Disable Next.js telemetry during the build.
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ---- Stage 3: production runner ----------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only the files required to run the server.
COPY --from=builder /app/public          ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static    ./.next/static

# The standalone output does not bundle node_modules for native
# addons like sodium-native. Copy it from the builder stage so
# Node can find it at runtime if present.
COPY --from=builder /app/node_modules    ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
