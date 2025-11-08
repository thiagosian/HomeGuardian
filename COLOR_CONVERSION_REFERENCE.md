# MUI Themes Color Extraction - Complete Analysis

## Extraction Source
- **Commit**: `ac2d11e^`
- **Files**:
  - `frontend/src/themes/classic.js`
  - `frontend/src/themes/modern.js`

## Conversion Format
All colors have been converted from HEX to **HSL (Hue Saturation Lightness)** format:
- Format: `H S% L%` (no units, as Tailwind CSS requires)
- Example: `#03a9f4` → `199 98% 48%`

---

## CLASSIC THEME (Light Mode)

### Primary Colors
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #03a9f4 | **199 98% 48%** | Cyan/Light Blue - Primary brand color |

### Secondary Colors
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #ff9800 | **36 100% 50%** | Orange - Secondary accent |

### Background
| Type | HEX | HSL | Description |
|------|-----|-----|-------------|
| Default | #fafafa | **0 0% 98%** | Off-white background |
| Paper | #ffffff | **0 0% 100%** | Pure white surfaces |

### Text
| Level | HEX | HSL | Description |
|-------|-----|-----|-------------|
| Primary | #24292e | **210 12% 16%** | Dark charcoal (high contrast) |
| Secondary | #6a737d | **212 8% 45%** | Medium gray (secondary text) |

### Diff Colors (Code Changes)
| Element | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Added Background | #e6ffed | **137 100% 95%** | Light green - Added line background |
| Added Text | #24292e | **210 12% 16%** | Dark charcoal - Added line text |
| Removed Background | #ffeef0 | **353 100% 97%** | Light pink - Removed line background |
| Removed Text | #24292e | **210 12% 16%** | Dark charcoal - Removed line text |
| Header Background | #f1f8ff | **210 100% 97%** | Light blue - Diff header |
| Header Text | #6a737d | **212 8% 45%** | Medium gray - Header text |
| Viewer Background | #f6f8fa | **210 29% 97%** | Very light blue-gray - Viewer bg |

---

## MODERN THEME (Dark Mode)

### Primary Colors
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #00e5ff | **186 100% 50%** | Electric cyan - Primary brand |
| Light | #40c4ff | **199 100% 63%** | Light cyan - Hover/Focus states |
| Dark | #00b8d4 | **188 100% 42%** | Dark cyan - Pressed states |

### Secondary Colors
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #1de9b6 | **165 82% 51%** | Electric green/Teal - Secondary |
| Light | #00f2a1 | **160 100% 47%** | Bright green - Light variant |
| Dark | #00bfa5 | **172 100% 37%** | Dark teal - Dark variant |

### Background
| Type | HEX | HSL | Description |
|------|-----|-----|-------------|
| Default | #111318 | **223 17% 8%** | Obsidian/Charcoal (main bg) |
| Paper | #2a2a2e | **240 5% 17%** | Dark elevated surfaces |

### Text
| Level | HEX | HSL | Description |
|-------|-----|-----|-------------|
| Primary | #fafafa | **0 0% 98%** | Almost white - Primary text |
| Secondary | #b0b0b0 | **0 0% 69%** | Light gray - Secondary text |
| Disabled | #6a6a6a | **0 0% 42%** | Medium gray - Disabled state |

### Status Colors

#### Error
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #f50057 | **339 100% 48%** | Vibrant magenta red |
| Light | #ff4081 | **340 100% 63%** | Light magenta |
| Dark | #c51162 | **333 84% 42%** | Dark magenta |

#### Warning
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #ffab00 | **40 100% 50%** | Vibrant amber |
| Light | #ffd740 | **47 100% 63%** | Light yellow |
| Dark | #ff8f00 | **34 100% 50%** | Dark orange |

#### Success
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #1de9b6 | **165 82% 51%** | Electric teal (same as secondary) |
| Light | #00f2a1 | **160 100% 47%** | Bright green |
| Dark | #00bfa5 | **172 100% 37%** | Dark teal |

#### Info
| Variant | HEX | HSL | Description |
|---------|-----|-----|-------------|
| Main | #00e5ff | **186 100% 50%** | Electric cyan (same as primary) |
| Light | #40c4ff | **199 100% 63%** | Light cyan |
| Dark | #00b8d4 | **188 100% 42%** | Dark cyan |

### Diff Colors (Code Changes - with transparency)
| Element | Color | HSL | Description |
|---------|-------|-----|-------------|
| Added Background | rgba(29, 233, 182, 0.15) | - | Green with 15% opacity |
| Added Text | #00f2a1 | **160 100% 47%** | Bright electric green |
| Removed Background | rgba(245, 0, 87, 0.15) | - | Red with 15% opacity |
| Removed Text | #ff4081 | **340 100% 63%** | Bright magenta |
| Header Background | rgba(0, 229, 255, 0.1) | - | Cyan with 10% opacity |
| Header Text | #40c4ff | **199 100% 63%** | Electric cyan |
| Viewer Background | #1a1a1a | **0 0% 10%** | Very dark gray |

---

## Tailwind Configuration Examples

### Using HSL Colors in Tailwind
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: {
        classic: 'hsl(199 98% 48%)',
        modern: {
          main: 'hsl(186 100% 50%)',
          light: 'hsl(199 100% 63%)',
          dark: 'hsl(188 100% 42%)',
        }
      },
      secondary: {
        classic: 'hsl(36 100% 50%)',
        modern: {
          main: 'hsl(165 82% 51%)',
          light: 'hsl(160 100% 47%)',
          dark: 'hsl(172 100% 37%)',
        }
      }
    }
  }
}
```

### CSS Custom Properties (Recommended)
```css
/* themes/classic.css */
:root[data-theme="classic"] {
  --color-primary: hsl(199 98% 48%);
  --color-secondary: hsl(36 100% 50%);
  --color-bg-default: hsl(0 0% 98%);
  --color-bg-paper: hsl(0 0% 100%);
  --color-text-primary: hsl(210 12% 16%);
  --color-text-secondary: hsl(212 8% 45%);
}

/* themes/modern.css */
:root[data-theme="modern"] {
  --color-primary-main: hsl(186 100% 50%);
  --color-primary-light: hsl(199 100% 63%);
  --color-primary-dark: hsl(188 100% 42%);
  --color-secondary-main: hsl(165 82% 51%);
  --color-secondary-light: hsl(160 100% 47%);
  --color-secondary-dark: hsl(172 100% 37%);
  --color-bg-default: hsl(223 17% 8%);
  --color-bg-paper: hsl(240 5% 17%);
  --color-text-primary: hsl(0 0% 98%);
  --color-text-secondary: hsl(0 0% 69%);
}
```

---

## Key Observations

### Classic Theme
- **Light mode** with high contrast
- Primary: Cyan (#03a9f4) - 98% saturation, 48% lightness
- Secondary: Orange (#ff9800) - Pure saturated orange
- Text: Very dark charcoal for readability
- Minimal status colors (defined only in modern theme)

### Modern Theme
- **Dark mode** with vibrant neon accents
- Primary: Electric cyan (#00e5ff) - 100% saturation
- Secondary: Electric teal (#1de9b6) - 82% saturation
- Rich status colors: Error (magenta), Warning (amber), Success (teal), Info (cyan)
- Diff colors use transparency for subtle backgrounds

### Color Consistency
- Info color mirrors Primary (cyan)
- Success color mirrors Secondary (teal/green)
- Modern theme uses fully saturated colors for impact on dark background
- Classic theme uses muted saturation for light background readability

---

## Files Referenced
- **Source**: `/home/user/HomeGuardian/MUI_THEMES_COLOR_EXTRACTION.json`
- **This Guide**: `/home/user/HomeGuardian/COLOR_CONVERSION_REFERENCE.md`
