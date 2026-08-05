# ─────────────────────────────────────────────────────────────────────────────
# Build stage
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# ─────────────────────────────────────────────────────────────────────────────
# Runtime
# ─────────────────────────────────────────────────────────────────────────────
# Render injects PORT automatically; expose it for documentation
EXPOSE 3000

# Start the bot
CMD ["node", "src/index.js"]
