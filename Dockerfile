# STAGE 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build && \
    npm prune --production

# STAGE 2: Build Backend Dependencies
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# STAGE 3: Final Runtime Image
ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.22
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install only runtime dependencies (removed build tools: make, g++)
# Optimized for Raspberry Pi: removed python3 (~60MB) and py3-setuptools (~5MB)
RUN apk add --no-cache \
    git \
    openssh \
    nodejs \
    npm \
    sqlite

# Set working directory
WORKDIR /app

# Copy only built artifacts from build stages
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy backend source
COPY backend/*.js ./backend/
COPY backend/routes ./backend/routes
COPY backend/services ./backend/services
COPY backend/middleware ./backend/middleware
COPY backend/utils ./backend/utils
COPY backend/config ./backend/config
COPY backend/migrations ./backend/migrations
COPY backend/validation ./backend/validation

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Set working directory for runtime
WORKDIR /app/backend

# Labels
LABEL \
    io.hass.name="HomeGuardian" \
    io.hass.description="Git-powered configuration manager for Home Assistant" \
    io.hass.version="1.3.0" \
    io.hass.type="addon" \
    io.hass.arch="aarch64|amd64|armhf|armv7"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:8099/api/health/live || exit 1

# Expose port
EXPOSE 8099

# Run script
CMD ["/run.sh"]
