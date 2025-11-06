# HomeGuardian
## Git-Powered Configuration Manager for Home Assistant

**HomeGuardian** is a Home Assistant Add-on that provides enterprise-grade Git version control for your configuration, wrapped in a simple, intuitive user interface.

### Vision

*"Provide the Home Assistant community with a configuration manager that has the power of Git and the simplicity of a native HA tool. Make configuration versioning, diffing, and restoration (even for a single automation) a safe, 1-click process."*

## Features

### Core Features (v1.0)

- ✅ **Native HA Integration**: Seamless Ingress support with HA authentication
- ✅ **Automatic Git Commits**: File watcher monitors `/config` and auto-commits changes
- ✅ **HA-Aware Parsing**: Understands automations, scripts, scenes, and more
- ✅**Visual Diff Viewer**: Compare any version with live configuration
- ✅ **Granular Restoration**: Restore individual automations, scripts, or files
- ✅ **HA Service Integration**: Reload automations/scripts directly from the UI
- ✅ **Remote Git Sync**: Native GitHub/GitLab push for off-site backups (killer feature)
- ✅ **Scheduled Backups**: Daily/weekly automated commits
- ✅ **REST API**: Programmatic access for advanced automations
- ✅ **i18n Support**: English and Portuguese

### Why HomeGuardian?

| Feature | HA Snapshots | Existing Backup Add-ons | **HomeGuardian** |
|---------|-------------|------------------------|------------------|
| Storage Efficiency | ❌ Poor | ❌ Poor | ✅ **Excellent (Git)** |
| Visual Diffs | ❌ No | ⚠️ Limited | ✅ **Yes** |
| Individual Item Restore | ❌ No | ⚠️ Limited | ✅ **Yes** |
| Native Remote Sync | ❌ No | ❌ No | ✅ **Yes (GitHub/GitLab)** |
| HA Service Reload | ❌ No | ⚠️ Limited | ✅ **Yes** |

## Installation

### Via HACS (Recommended)

1. Open HACS in your Home Assistant
2. Navigate to "Add-ons"
3. Search for "HomeGuardian"
4. Click "Install"

### Manual Installation

1. Add this repository to your Home Assistant:
   ```
   https://github.com/thiagosian/HomeGuardian
   ```
2. Install the "HomeGuardian" add-on
3. Start the add-on
4. Access via the sidebar

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

- **Backend**: Node.js (Express.js)
  - File watching with Chokidar
  - Git operations with simple-git
  - SQLite for metadata storage
- **Frontend**: React (Vite)
  - Material-UI components
  - Visual diff viewer
  - Real-time status updates

## Security

- SSH keys and Personal Access Tokens are encrypted (AES-256) at rest
- Uses Home Assistant's native authentication
- `secrets.yaml` excluded by default (configurable)

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

- **Issues**: https://github.com/thiagosian/HomeGuardian/issues
- **Discussions**: https://github.com/thiagosian/HomeGuardian/discussions
- **Home Assistant Community**: [HomeGuardian Thread]

## Roadmap

- [ ] Multi-repository support
- [ ] Advanced conflict resolution
- [ ] Custom file exclusion patterns
- [ ] Email notifications for failed backups
- [ ] Webhook support

---

**Made with ❤️ for the Home Assistant community**
