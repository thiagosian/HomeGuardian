ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.22
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install system dependencies
RUN apk add --no-cache \
    git \
    openssh \
    nodejs \
    npm \
    sqlite

# Set working directory
WORKDIR /app

# Build frontend
COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source
COPY backend/ ./

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

# Set working directory for runtime
WORKDIR /app/backend

# Labels
LABEL \
    io.hass.name="HomeGuardian" \
    io.hass.description="Git-powered configuration manager for Home Assistant" \
    io.hass.version="1.0.0" \
    io.hass.type="addon" \
    io.hass.arch="aarch64|amd64|armhf|armv7|i386"

# Expose port
EXPOSE 8099

# Run script
CMD ["/run.sh"]
