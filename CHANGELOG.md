# Changelog

All notable changes to HomeGuardian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-07

### Added
- **ESPHome Configuration Parsing**: Fully implemented ESPHome device configuration parsing
  - Parses all ESPHome YAML files from `/config/esphome/` directory
  - Displays device name, platform, board, and components
  - New "ESPHome" tab in Items page showing all configured devices
  - Toggle now functional in Settings page (`parse_esphome` option)

- **Packages Directory Parsing**: Fully implemented packages directory parsing
  - Parses all package YAML files from `/config/packages/` directory
  - Extracts package components and configuration
  - New "Packages" tab in Items page showing all packages
  - Toggle now functional in Settings page (`parse_packages` option)

- **Lovelace Dashboard Backup**: Implemented Lovelace dashboard backup and parsing
  - Parses all Lovelace dashboard JSON files from `/config/.storage/lovelace*`
  - Displays dashboard title, view count, and configuration
  - New "Dashboards" tab in Items page showing all dashboards
  - **Lovelace now included in backups by default** (previously excluded)
  - New `backup_lovelace` setting to control dashboard backup (default: true)
  - Configurable via Settings page

- **Enhanced Items Page UI**:
  - Added 3 new tabs: ESPHome, Packages, and Dashboards
  - Scrollable tabs for better mobile experience
  - Displays total count for each category
  - All 6 categories now fully functional

- **Translations**: Added complete Portuguese and English translations for new features
  - ESPHome items translation
  - Packages items translation
  - Dashboards items translation
  - Settings descriptions for new options

### Changed
- **Default Configuration**: ESPHome and Packages parsing now enabled by default
- **Backup Scope**: Lovelace dashboards now included in backups by default
- **File Watcher**: Conditionally excludes Lovelace based on `backup_lovelace` setting
- **Git Ignore**: Conditionally excludes Lovelace based on `backup_lovelace` setting

### Fixed
- **ESPHome Toggle**: ESPHome toggle in Settings page now works (implementation was missing)
- **Packages Toggle**: Packages toggle in Settings page now works (implementation was missing)
- **Lovelace Exclusion**: Lovelace dashboards were being excluded from backups, now included by default

### Technical Details
- Added `parseESPHome()` method in HAParser service
- Added `parsePackages()` method in HAParser service
- Added `parseLovelaceDashboards()` method in HAParser service
- Updated `parseAllItems()` to include all new parsers with conditional execution
- Updated `getItem()` to support new item types (esphome, package, lovelace_dashboard)
- Enhanced frontend Items.jsx with scrollable tabs and new data display
- Added `backup_lovelace` environment variable support in GitService and FileWatcher
- All parsing operations run in parallel using `Promise.all()` for optimal performance

## [1.0.6] - 2025-11-07

### Added
- Comprehensive settings UI with all configuration options
- `remote_enabled` option to make remote repository feature optional (default: disabled)
- Complete translations for all settings in English and Portuguese
- Visual organization of settings into logical sections:
  - General (Language, Log Level)
  - Backup & Commit (Auto Commit, Debounce, Scheduled Backups, Git User Info)
  - Parsing Options (ESPHome, Packages, Secrets)
  - Remote Repository (Optional feature with toggle)

### Changed
- Remote repository configuration now hidden by default and only shown when enabled
- Improved settings UI with proper labels and descriptions for all options
- Enhanced i18n with descriptive labels instead of technical field names
- Settings organized into separate cards for better UX

### Fixed
- Added `.storage` to `.gitignore` to exclude Home Assistant storage files from backups

## [1.0.0] - 2025-11-06

### Added

#### Core Features (Phase 1-2)
- Home Assistant Add-on with Ingress support
- Native HA authentication integration
- Git repository initialization and management
- Automatic file watching with Chokidar
- Configurable debounce for auto-commits (default: 60s)
- Manual backup trigger ("Backup Now" button)
- Scheduled backups with cron (configurable time)
- SQLite database for metadata and settings

#### HA-Aware Features (Phase 3)
- YAML parser for Home Assistant configurations
- Support for automations.yaml parsing
- Support for scripts.yaml parsing
- Support for scenes.yaml parsing
- Support for !include and !include_dir patterns
- Individual item identification and tracking
- Changed items detection per commit

#### History & Viewing (Phase 3)
- Complete commit history viewer
- Visual diff viewer for all changes
- File-level diff comparison
- Commit details with author and timestamp
- Pagination support for large histories

#### Restoration Features (Phase 4)
- Granular item restoration (single automation/script/scene)
- Full file restoration
- Automatic safety backup before restoration
- Home Assistant service reload integration
- Support for reloading: automations, scripts, scenes, core config

#### Remote Sync Features (Phase 5)
- GitHub/GitLab remote repository support
- SSH key generation and management
- Personal Access Token (PAT) authentication
- Automatic push after commits (configurable)
- Manual push trigger
- Remote connection testing
- Push status tracking (pending/synced/failed)

#### API (Phase 6)
- RESTful API for all operations
- `/api/backup/now` - Manual backup trigger
- `/api/backup/status` - Current Git status
- `/api/history` - Commit history
- `/api/restore/file` - File restoration
- `/api/restore/item` - Item restoration
- `/api/restore/reload/:domain` - HA service reload
- `/api/settings` - Settings management
- `/api/status` - System status and statistics

#### UI/UX (Phase 6)
- Modern React frontend with Material-UI
- Responsive design for mobile and desktop
- Dashboard with system overview
- Real-time status updates
- History browser with search
- Items viewer (automations, scripts, scenes)
- Settings page with SSH key management
- Internationalization (i18n) support
- English (en-US) translations
- Portuguese (pt-BR) translations

#### Configuration Options
- `auto_commit_enabled` - Enable/disable auto-commits
- `auto_commit_debounce` - Debounce time in seconds
- `auto_push_enabled` - Enable/disable auto-push
- `scheduled_backup_enabled` - Enable/disable scheduled backups
- `scheduled_backup_time` - Time for scheduled backups (HH:mm)
- `git_user_name` - Git commit author name
- `git_user_email` - Git commit author email
- `parse_esphome` - Parse ESPHome configurations (future)
- `parse_packages` - Parse packages directory (future)
- `exclude_secrets` - Exclude secrets.yaml from backups

#### Security
- AES-256 encryption for sensitive data (SSH keys, tokens)
- Home Assistant authentication integration
- Secure credential storage in SQLite
- Default .gitignore to protect secrets

### Technical Details

- **Backend**: Node.js 18+, Express.js
- **Frontend**: React 18, Vite, Material-UI
- **Database**: SQLite3
- **Git Operations**: simple-git
- **File Watching**: Chokidar
- **Scheduling**: node-cron
- **i18n**: i18next, react-i18next

### Known Limitations

- Item restoration from !include files restores the entire file (not individual items within)
- ESPHome and packages parsing not yet implemented (planned for future release)
- No built-in conflict resolution for complex merge scenarios

### Documentation

- Comprehensive README with installation and usage instructions
- CONTRIBUTING.md with development guidelines
- Inline code documentation

---

## Future Roadmap

### [1.1.0] - Planned
- Advanced conflict resolution UI
- Multiple remote repository support
- Custom .gitignore patterns
- Email notifications for failed backups
- Webhook support for backup events

### [1.2.0] - Planned
- ESPHome configuration parsing
- Packages directory parsing
- Dashboard widgets
- Backup size optimization tools

### [2.0.0] - Vision
- Multi-instance support
- Advanced branching strategies
- Backup encryption at rest
- Integration with Home Assistant backup system
- Mobile app companion

---

**Note**: This is the initial release (v1.0.0) implementing all core features as defined in the PRD. Feedback and contributions are welcome!
