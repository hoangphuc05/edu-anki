# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: Build the webapp (React + Vite) into static assets
# ---------------------------------------------------------------------------
FROM node:24-alpine AS webapp-build
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY webapp/package.json webapp/
COPY server/package.json server/
COPY components/shared-types/package.json components/shared-types/
COPY packages/srs-engine/package.json packages/srs-engine/

# Install all workspace dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy source and build the webapp
COPY webapp webapp
COPY components/shared-types components/shared-types
COPY packages/srs-engine packages/srs-engine
RUN pnpm --filter webapp build

# ---------------------------------------------------------------------------
# Stage 2: Runtime image — Express server serving the built webapp
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN corepack enable

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY webapp/package.json webapp/
COPY server/package.json server/
COPY components/shared-types/package.json components/shared-types/
COPY packages/srs-engine/package.json packages/srs-engine/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy server source
COPY server server
COPY components/shared-types components/shared-types
COPY packages/srs-engine packages/srs-engine

# Copy the built webapp from the build stage
COPY --from=webapp-build /app/webapp/dist webapp/dist

# Generate the Prisma client (required at runtime)
RUN pnpm --filter server exec prisma generate

# The server binds to PORT (default 3000)
EXPOSE 3000

# Persist the SQLite database outside the container filesystem
VOLUME ["/app/server/prisma"]

WORKDIR /app/server
CMD ["node", "index.js"]
