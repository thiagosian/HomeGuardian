# ARG for base image - must be declared before first FROM in multi-stage builds
ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.22

# STAGE 1: Build Frontend
# This stage installs ALL dependencies (including devDependencies like Vite)
# needed for building the frontend, then compiles it to static files
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy package files first for better Docker layer caching
COPY frontend/package*.json ./
# Install all dependencies including devDependencies (Vite, Tailwind, etc.)
# needed for the build process
RUN npm ci
# Copy source code and build the frontend
COPY frontend/ ./
RUN npm run build

# STAGE 2: Build Backend Dependencies
# Backend only needs production dependencies since there's no build step
# node_modules will be copied to the final image for runtime
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
# Install build tools needed for compiling native modules (sqlite3, node-ssh, etc.)
# python3-dev is required for node-gyp to compile native addons
# py3-setuptools provides distutils which node-gyp requires
RUN apk add --no-cache python3 python3-dev py3-setuptools make g++
COPY backend/package*.json ./
RUN npm ci --only=production

# STAGE 3: Final Runtime Image
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

# Copy only built artifacts from build stages (no source code or dev dependencies)
# Frontend: only the compiled static files (dist/), not node_modules or source
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
# Backend: production node_modules needed for runtime
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
    io.hass.version="1.5.3" \
    io.hass.type="addon" \
    io.hass.arch="aarch64|amd64|armhf|armv7"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:8099/api/health/live || exit 1

# Expose port
EXPOSE 8099

# Run script
CMD ["/run.sh"]
