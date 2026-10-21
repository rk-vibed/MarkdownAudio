# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Build Frontend Assets
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cached unless package files change)
COPY package*.json ./
RUN npm ci || npm install --legacy-peer-deps

# Copy source files
COPY . .

# Compile client frontend into /app/dist
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Production environment configuration
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--experimental-strip-types"

# Copy package descriptors and node_modules from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/docs ./docs

# Ensure required directories exist with non-root ownership
RUN mkdir -p /app/audio_output /app/docs && chown -R node:node /app

# Use non-root node user for security
USER node

# Expose web server port
EXPOSE 3000

# Mount points for markdown document library and persisted audio WAV files
VOLUME ["/app/docs", "/app/audio_output"]

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Launch full-stack Express server
CMD ["node", "--experimental-strip-types", "server.ts"]
