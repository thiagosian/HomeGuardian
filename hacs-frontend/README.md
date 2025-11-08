# HomeGuardian UI - HACS Frontend Integration

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![License](https://img.shields.io/github/license/thiagosian/HomeGuardian)](LICENSE)

Icon-based version control UI integration for Home Assistant. Part of the [HomeGuardian](https://github.com/thiagosian/HomeGuardian) ecosystem.

## Features

- 🎯 **Smart Icon Injection**: History icons appear next to automations, scripts, scenes, blueprints, and dashboards in the native HA UI
- 📜 **Quick History Access**: Click icons to view the last 5 commits affecting that entity
- 🔄 **One-Click Rollback**: Restore previous versions with safety backups
- 🎨 **Native Integration**: Seamlessly integrates with Home Assistant's UI without custom cards
- 🔒 **Safety First**: Automatic backups before any rollback operation

## Prerequisites

1. **HomeGuardian Add-on** must be installed and running
   - See [main repository](https://github.com/thiagosian/HomeGuardian) for add-on installation

2. **HACS** (Home Assistant Community Store) must be installed
   - [HACS Installation Guide](https://hacs.xyz/docs/setup/download)

## Installation

### Via HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Click the 3 dots in the top right corner
3. Select "Custom repositories"
4. Add repository URL: `https://github.com/thiagosian/HomeGuardian`
5. Select category: **"Integration"**
6. Click "Add"
7. Search for "HomeGuardian UI"
8. Click "Download"
9. Restart Home Assistant

### Manual Installation

1. Download the latest release
2. Copy the `custom_components/homeguardian_ui` directory to your Home Assistant's `custom_components` directory
3. Restart Home Assistant

## Configuration

No configuration required! The integration automatically activates once the HomeGuardian add-on is running.

### Verify Installation

1. Open Home Assistant Developer Tools
2. Go to the "Logs" tab
3. Look for: `"HomeGuardian UI setup completed"`

## Usage

### Icon Locations

History icons automatically appear in these locations:

| Entity Type | Icon Location |
|-------------|--------------|
| **Automations** | Next to automation name in editor |
| **Scripts** | Next to script name in editor |
| **Scenes** | Next to scene name in editor |
| **Blueprints** | Next to blueprint name in editor and list |
| **Voice Assistants** | Next to pipeline name in settings |
| **Dashboards** | In dashboard configuration menu |

### Icon States

- **Green** (with number): Entity has version history (shows commit count)
- **Gray**: No history available yet
- **Spinning**: Loading history data

### Quick Actions

1. **Click icon** → View last 5 commits affecting this entity
2. **Click commit** → View detailed diff
3. **Click "Restore"** → Rollback to that version (creates safety backup)

## Architecture

```
┌─────────────────────────────────────────┐
│  Home Assistant Frontend                │
│  ┌───────────────────────────────────┐  │
│  │  Native UI (Automations, etc.)    │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  HomeGuardian UI            │  │  │
│  │  │  (Icon Injector)            │  │  │
│  │  └──────────┬──────────────────┘  │  │
│  └─────────────┼─────────────────────┘  │
└────────────────┼────────────────────────┘
                 │ API
                 ▼
┌─────────────────────────────────────────┐
│  HomeGuardian Add-on                    │
│  (Git Backend + Parser)                 │
└─────────────────────────────────────────┘
```

## Supported Entity Types

| Entity Type | Priority | Status |
|-------------|----------|--------|
| Automation | P0 | ✅ Implemented |
| Script | P0 | ✅ Implemented |
| Scene | P0 | ✅ Implemented |
| Blueprint | P0 | ✅ Implemented |
| Voice Assistant | P0 | ✅ Implemented |
| Dashboard | P0 | ✅ Implemented |
| ESPHome | P1 | 🔄 Planned |
| Package | P2 | 🔄 Planned |

## Troubleshooting

### Icons Not Appearing

1. **Verify add-on is running**:
   ```bash
   # Check add-on logs
   Settings → Add-ons → HomeGuardian → Logs
   ```

2. **Check integration loaded**:
   ```bash
   # Developer Tools → Logs
   # Look for "HomeGuardian UI setup completed"
   ```

3. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

4. **Verify API connectivity**:
   ```bash
   # In browser console (F12):
   fetch('/api/hassio_ingress/<addon-slug>/api/items')
     .then(r => r.json())
     .then(console.log)
   ```

### Icons Appear But Don't Work

1. **Check add-on API**:
   - Settings → Add-ons → HomeGuardian → Logs
   - Look for API errors

2. **Verify Git repository initialized**:
   - Open HomeGuardian add-on UI
   - Check if Git status shows "Repository initialized"

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
cd hacs-frontend
npm install
```

### Development Mode

```bash
npm run dev
# Watch mode - automatically rebuilds on changes
```

### Build Production Bundle

```bash
npm run build
# Output: custom_components/homeguardian_ui/www/dist/homeguardian-ui.js
```

### Testing

```bash
# Copy to Home Assistant custom_components
cp -r custom_components/homeguardian_ui /config/custom_components/

# Restart Home Assistant
# Check logs for errors
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the main repository.

## License

MIT License - see [LICENSE](../../LICENSE)

## Related Projects

- [HomeGuardian Add-on](https://github.com/thiagosian/HomeGuardian) - Main add-on with Git backend
- [HomeGuardian Card](../hacs-card/README.md) - Optional dashboard card

## Support

- [GitHub Issues](https://github.com/thiagosian/HomeGuardian/issues)
- [Discussion Forum](https://github.com/thiagosian/HomeGuardian/discussions)
