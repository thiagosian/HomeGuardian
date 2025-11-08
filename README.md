# HomeGuardian
## Git-Powered Configuration Manager for Home Assistant

**HomeGuardian** is a comprehensive Home Assistant solution that provides enterprise-grade Git version control for your configuration, wrapped in a simple, intuitive user interface.

### What is HomeGuardian?

HomeGuardian consists of two integrated components:

1. **HomeGuardian Add-on**: Full-featured Git version control manager with visual diff viewer, granular restoration, and remote sync capabilities
2. **HomeGuardian UI (HACS Integration)**: Visual icon-based indicators that show Git status directly in your Home Assistant frontend

### Vision

*"Provide the Home Assistant community with a configuration manager that has the power of Git and the simplicity of a native HA tool. Make configuration versioning, diffing, and restoration (even for a single automation) a safe, 1-click process."*

## Features

### HomeGuardian Add-on Features

- ✅ **Native HA Integration**: Seamless Ingress support with HA authentication
- ✅ **Automatic Git Commits**: File watcher monitors `/config` and auto-commits changes
- ✅ **HA-Aware Parsing**: Understands automations, scripts, scenes, and more
- ✅ **Visual Diff Viewer**: Compare any version with live configuration
- ✅ **Granular Restoration**: Restore individual automations, scripts, or files
- ✅ **HA Service Integration**: Reload automations/scripts directly from the UI
- ✅ **Remote Git Sync**: Native GitHub/GitLab push for off-site backups (killer feature)
- ✅ **Scheduled Backups**: Daily/weekly automated commits
- ✅ **REST API**: Programmatic access for advanced automations
- ✅ **i18n Support**: English and Portuguese

### HomeGuardian UI (HACS Integration) Features

- ✅ **Visual Git Status**: Color-coded icons showing file status (modified, added, deleted)
- ✅ **Lovelace Integration**: Icons appear directly in your dashboards
- ✅ **Real-time Updates**: Status updates automatically as you make changes
- ✅ **Commit History**: Quick access to view past changes for any entity
- ✅ **Non-intrusive**: Lightweight overlay that doesn't affect HA performance

### Why HomeGuardian?

| Feature | HA Snapshots | Existing Backup Add-ons | **HomeGuardian** |
|---------|-------------|------------------------|------------------|
| Storage Efficiency | ❌ Poor | ❌ Poor | ✅ **Excellent (Git)** |
| Visual Diffs | ❌ No | ⚠️ Limited | ✅ **Yes** |
| Individual Item Restore | ❌ No | ⚠️ Limited | ✅ **Yes** |
| Native Remote Sync | ❌ No | ❌ No | ✅ **Yes (GitHub/GitLab)** |
| HA Service Reload | ❌ No | ⚠️ Limited | ✅ **Yes** |

## Installation

### HomeGuardian Add-on

#### Via Home Assistant Add-on Store

1. Navigate to **Settings** → **Add-ons** → **Add-on Store**
2. Click the menu (three dots) → **Repositories**
3. Add this repository:
   ```
   https://github.com/thiagosian/HomeGuardian
   ```
4. Find and install the "HomeGuardian" add-on
5. Start the add-on
6. Access via the Home Assistant sidebar

### HomeGuardian UI (HACS Integration)

#### Prerequisites

- Home Assistant Community Store (HACS) installed
- HomeGuardian Add-on running (the UI connects to the add-on's API)

#### Via HACS (Recommended)

1. Open HACS in your Home Assistant
2. Click on **Integrations**
3. Click the menu (three dots) → **Custom repositories**
4. Add this repository URL:
   ```
   https://github.com/thiagosian/HomeGuardian
   ```
5. Select category: **Integration**
6. Click **Add**
7. Search for "HomeGuardian UI"
8. Click **Download**
9. Restart Home Assistant

#### Manual Installation

1. Download the latest release from the [releases page](https://github.com/thiagosian/HomeGuardian/releases)
2. Extract the `hacs-frontend/custom_components/homeguardian_ui` folder to your `config/custom_components/` directory
3. Your directory structure should look like:
   ```
   config/
   └── custom_components/
       └── homeguardian_ui/
           ├── __init__.py
           ├── manifest.json
           └── www/
               └── dist/
                   └── homeguardian-ui.js
   ```
4. Restart Home Assistant

#### Configuration

The HomeGuardian UI integration is automatically configured once installed. It will:
- Inject visual Git status icons into your Lovelace dashboards
- Connect to the HomeGuardian Add-on API to fetch real-time status
- Add click handlers to view commit history for any entity

No additional configuration is required!

## Configuration

### Basic Options

```yaml
log_level: info
auto_commit_enabled: true
auto_commit_debounce: 60
auto_push_enabled: false
scheduled_backup_enabled: false
scheduled_backup_time: "03:00"
git_user_name: "HomeGuardian"
git_user_email: "homeguardian@homeassistant.local"
```

### Remote Git Sync (GitHub/GitLab)

1. Open HomeGuardian from the sidebar
2. Navigate to Settings
3. Click "Generate SSH Key"
4. Copy the public key to your GitHub/GitLab repository
5. Enter the repository URL (e.g., `git@github.com:username/ha-config.git`)
6. Click "Test Connection"
7. Enable "Auto Push"

## Usage

### Automatic Backups

HomeGuardian automatically monitors your `/config` directory and creates Git commits when changes are detected (with configurable debounce).

### Manual Backups

Click the "Backup Now" button to immediately create a commit.

### Viewing History

Navigate to the "History" tab to see all commits. Click on any commit to view changes.

### Restoring Configuration

1. Find the commit/item you want to restore in History
2. Click "View Diff" to compare with current version
3. Click "Restore" (a safety backup is created automatically)
4. Click "Reload Automations/Scripts" to apply changes

### API Access

```bash
# Manual backup
curl -X POST http://homeassistant.local:8123/api/hassio_ingress/xxx/api/backup-now \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get status
curl http://homeassistant.local:8123/api/hassio_ingress/xxx/api/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture

### HomeGuardian Add-on

- **Backend**: Node.js (Express.js)
  - File watching with Chokidar
  - Git operations with simple-git
  - SQLite for metadata storage
  - REST API for external integrations
- **Frontend**: React (Vite)
  - Material-UI components
  - Visual diff viewer
  - Real-time status updates

### HomeGuardian UI (HACS Integration)

- **Technology**: TypeScript + Lit Web Components
  - Lightweight and performant
  - Native Web Components for HA compatibility
- **Build System**: Rollup
  - Single compiled JavaScript file
  - Optimized for browser delivery via HACS
- **Integration Method**:
  - Injected as a custom panel resource
  - Uses HA's frontend API for seamless integration
  - Connects to HomeGuardian Add-on REST API

## Security

- **Automatic Encryption**: On first startup, HomeGuardian generates a unique 256-bit encryption key
- **Data Protection**: SSH keys and Personal Access Tokens are encrypted (AES-256) at rest
- **Secure Storage**: Encryption key stored in `/data/.encryption_key` with 600 permissions
- **Home Assistant Auth**: Uses HA's native authentication - no custom auth layer
- **Secrets Protection**: `secrets.yaml` excluded by default (configurable)

See [SECURITY.md](SECURITY.md) for detailed security information and best practices.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

- **Issues**: https://github.com/thiagosian/HomeGuardian/issues
- **Discussions**: https://github.com/thiagosian/HomeGuardian/discussions
- **Home Assistant Community**: [HomeGuardian Thread]

## HACS Integration

HomeGuardian is designed to work seamlessly with the Home Assistant Community Store (HACS). The HomeGuardian UI component is distributed as a HACS integration, providing:

- **Easy Installation**: One-click installation through HACS
- **Automatic Updates**: HACS will notify you when new versions are available
- **Community Support**: Leverage the HACS ecosystem for support and feedback
- **Standard Compliance**: Follows HACS guidelines and best practices

### HACS Recognition Requirements

For HACS to properly recognize and install HomeGuardian UI, the following files are maintained in the repository:

- `hacs-frontend/hacs.json` - HACS metadata configuration
- `hacs-frontend/info.md` - Short description for HACS UI
- `hacs-frontend/README.md` - Detailed documentation
- `hacs-frontend/custom_components/homeguardian_ui/manifest.json` - Home Assistant integration manifest
- `hacs-frontend/custom_components/homeguardian_ui/www/dist/` - Compiled JavaScript files

All compiled assets are automatically built and committed during the release process to ensure HACS users receive ready-to-use files.

## Roadmap

- [ ] Multi-repository support
- [ ] Advanced conflict resolution
- [ ] Custom file exclusion patterns
- [ ] Email notifications for failed backups
- [ ] Webhook support
- [ ] Enhanced HACS UI features (inline diffs, quick restore)

---

**Made with ❤️ for the Home Assistant community**
