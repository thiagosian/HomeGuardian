#!/usr/bin/with-contenv bashio
# ==============================================================================
# HomeGuardian startup script
# ==============================================================================

bashio::log.info "Starting HomeGuardian..."

# Export configuration from add-on options
export LOG_LEVEL=$(bashio::config 'log_level')
export AUTO_COMMIT_ENABLED=$(bashio::config 'auto_commit_enabled')
export AUTO_COMMIT_DEBOUNCE=$(bashio::config 'auto_commit_debounce')
export AUTO_PUSH_ENABLED=$(bashio::config 'auto_push_enabled')
export SCHEDULED_BACKUP_ENABLED=$(bashio::config 'scheduled_backup_enabled')
export SCHEDULED_BACKUP_TIME=$(bashio::config 'scheduled_backup_time')
export GIT_USER_NAME=$(bashio::config 'git_user_name')
export GIT_USER_EMAIL=$(bashio::config 'git_user_email')
export PARSE_ESPHOME=$(bashio::config 'parse_esphome')
export PARSE_PACKAGES=$(bashio::config 'parse_packages')
export EXCLUDE_SECRETS=$(bashio::config 'exclude_secrets')
export REMOTE_ENABLED=$(bashio::config 'remote_enabled')

# Export Home Assistant environment variables
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"
export HOMEASSISTANT_API="http://supervisor/core/api"
export CONFIG_PATH="/config"
export DATA_PATH="/data"

# Ensure data directory exists
mkdir -p /data

# Start the application
bashio::log.info "Configuration loaded, starting Node.js server..."
cd /app/backend
exec node --max-old-space-size=256 --optimize-for-size server.js
