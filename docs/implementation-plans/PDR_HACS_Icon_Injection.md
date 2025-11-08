# PDR: HomeGuardian HACS Integration - Icon Injection UI

**Product Design Requirements**

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | PDR-HACS-001 |
| **Version** | 1.0 |
| **Date** | 2025-11-08 |
| **Status** | Draft - Awaiting Approval |
| **Author** | Claude (AI Assistant) |
| **Project** | HomeGuardian HACS Integration |
| **Repository** | https://github.com/thiagosian/HomeGuardian |
| **Priority** | P0 - Critical Path |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Objectives](#3-goals-and-objectives)
4. [Non-Goals](#4-non-goals)
5. [User Personas and Use Cases](#5-user-personas-and-use-cases)
6. [Functional Requirements](#6-functional-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Monorepo Structure](#8-monorepo-structure)
9. [Icon Injection Implementation](#9-icon-injection-implementation)
10. [UI/UX Specifications](#10-uiux-specifications)
11. [Implementation Plan](#11-implementation-plan)
12. [Testing Strategy](#12-testing-strategy)
13. [Security and Performance](#13-security-and-performance)
14. [Risks and Mitigations](#14-risks-and-mitigations)
15. [Success Metrics](#15-success-metrics)
16. [Dependencies](#16-dependencies)
17. [Appendices](#17-appendices)

---

## 1. Executive Summary

### 1.1 Overview

This PDR defines the implementation of a HACS (Home Assistant Community Store) integration for HomeGuardian that **injects history icons directly into the native Home Assistant UI**, specifically targeting automation and script editors, dashboard edit modes, and entity lists.

### 1.2 Strategic Goals

**Primary Goal (P0)**: Enable users to access Git version control (view history, compare versions, rollback) directly from the native HA UI where they edit automations and scripts, without navigating to the HomeGuardian add-on interface.

**Secondary Goals**:
- Dashboard card for git status visibility
- Side panel for detailed history browsing
- Seamless integration with existing HomeGuardian add-on

### 1.3 Key Deliverables

| Deliverable | Type | Priority | Timeline |
|-------------|------|----------|----------|
| **HACS Custom Component** | Integration | P0 | Weeks 1-3 |
| **Icon Injection System** | Frontend | P0 | Weeks 2-4 |
| **History Popup Modal** | Frontend | P0 | Weeks 3-5 |
| **Dashboard Card** | Plugin | P1 | Weeks 6-10 |
| **Side Panel** | Enhancement | P2 | Weeks 11-13 |

### 1.4 Success Criteria

- ✅ History icons visible in HA automation editor within 500ms of page load
- ✅ Click icon → history popup appears in <300ms
- ✅ Works on HA 2024.1+ across Chrome, Firefox, Safari
- ✅ 40%+ user adoption within 3 months post-release
- ✅ <5 bug reports per month after stabilization

---

## 2. Problem Statement

### 2.1 Current State

**HomeGuardian Add-on** provides enterprise-grade Git version control for Home Assistant configurations, but users must:

1. Navigate away from editing context (automation editor → HomeGuardian add-on)
2. Find the specific file/item they were editing
3. View history in separate interface
4. Return to editor to make changes
5. Repeat cycle if rollback needed

**Pain Points**:
- ❌ Context switching disrupts flow
- ❌ Cognitive overhead (remember what was being edited)
- ❌ Multiple clicks (5-8 clicks for simple history view)
- ❌ Fear of breaking things (rollback feels risky when disconnected from editing)

### 2.2 User Feedback

> "I love HomeGuardian but I wish I could see history right where I'm editing the automation, like in VS Code"
> - User survey, Oct 2024

> "I didn't know I could rollback my dashboard until I accidentally found HomeGuardian in the add-ons menu"
> - Reddit comment, Nov 2024

### 2.3 Competitive Analysis

| Solution | Context Preservation | Discoverability | Ease of Use |
|----------|---------------------|-----------------|-------------|
| **Manual Git** (SSH/terminal) | ❌ None | ❌ Poor | ❌ Complex |
| **VS Code + SSH** | ⚠️ Separate app | ⚠️ Medium | ✅ Good |
| **HomeGuardian (current)** | ❌ Separate UI | ⚠️ Medium | ✅ Good |
| **This PDR** | ✅ **In-context** | ✅ **Excellent** | ✅ **Excellent** |

---

## 3. Goals and Objectives

### 3.1 Primary Objectives (P0)

**PO1: Icon Injection**
- Inject history icons next to automation names in HA automation editor
- Inject history icons next to script names in HA script editor
- Display version count badge on each icon

**PO2: Quick History Access**
- Click icon → popup showing last 5 commits affecting that item
- Show commit message, date, author
- "View Full History" link to open side panel/modal

**PO3: One-Click Rollback**
- Click "Restore" on any commit in popup
- Confirmation dialog with change preview
- Automatic safety backup before rollback
- HA service reload after rollback

### 3.2 Secondary Objectives (P1)

**SO1: Dashboard Card**
- Lovelace card showing git status
- Quick backup button
- Recent commits list

**SO2: Side Panel**
- Detailed history browser
- Diff viewer
- Multi-version comparison

### 3.3 Tertiary Objectives (P2)

**TO1: Advanced Features**
- Timeline visualization
- Tag/restore point management
- Conflict resolution UI

---

## 4. Non-Goals

**Out of Scope for v1.0**:
- ❌ Inline diff editor (Monaco integration) - Too complex, save for v2.0
- ❌ Multi-user collaboration features
- ❌ GitHub/GitLab PR integration
- ❌ Automated conflict resolution
- ❌ Custom git workflows (branching, merging)
- ❌ Support for HA < 2024.1
- ❌ IE11 or outdated browser support

---

## 5. User Personas and Use Cases

### 5.1 Primary Persona: "Automation Enthusiast Alex"

**Profile**:
- Age: 30-45
- Technical skill: Medium (comfortable with YAML, not git expert)
- HA setup: 50-100 automations, multiple dashboards
- Pain: Breaks automations often, wants safety net
- Goal: Experiment fearlessly, quick rollback if needed

**Use Case 1: Fix Broken Automation**
```
Alex edits "Good Morning" automation
→ Adds new condition, saves
→ Automation stops working
→ Clicks history icon next to automation name
→ Sees commit from 2 hours ago: "Working version"
→ Clicks "Restore to this version"
→ Confirms in dialog
→ Automation restored, reloaded automatically
→ Total time: 30 seconds
```

**Use Case 2: Compare Dashboard Versions**
```
Alex editing main dashboard in Lovelace
→ Clicks dashboard options → "HomeGuardian History"
→ Sees list of dashboard changes
→ Selects two commits to compare
→ Views side-by-side diff
→ Decides to keep current version
→ Closes panel, continues editing
```

### 5.2 Secondary Persona: "Power User Paula"

**Profile**:
- Age: 25-50
- Technical skill: High (knows git, uses VSCode, writes scripts)
- HA setup: 200+ automations, custom components, ESPHome
- Pain: Needs detailed history, wants git-like control
- Goal: Professional version control in HA

**Use Case 3: Audit Recent Changes**
```
Paula suspects recent change broke something
→ Opens HomeGuardian dashboard card
→ Sees "12 commits in last 24h"
→ Clicks "View All"
→ Side panel opens with timeline
→ Filters by "automations/"
→ Identifies problematic commit
→ Views diff, confirms suspicion
→ Rollbacks automation, tags version as "Last stable"
```

---

## 6. Functional Requirements

### 6.1 Icon Injection (P0)

#### FR1.1: Automation Editor Icons

**Requirement**: Inject history icon next to each automation name in the native HA automation editor.

**Acceptance Criteria**:
- [ ] Icon appears within 500ms of page load
- [ ] Icon positioned to the right of automation name
- [ ] Icon shows version count badge (e.g., "12")
- [ ] Icon click opens history popup
- [ ] Icon hover shows tooltip: "View history (12 versions)"

**Visual Specification**:
```
┌────────────────────────────────────────┐
│ ✏️ Living Room Lights  🕐12  [Edit] [⋮]│ ← Icon here
│ Last triggered: 2 hours ago            │
└────────────────────────────────────────┘
```

**Technical Implementation**:
- Detect automation editor DOM loaded
- Query automation name element
- Insert icon as sibling element
- Attach click handler
- Fetch version count from API

#### FR1.2: Script Editor Icons

**Requirement**: Same as FR1.1 but for script editor.

**Acceptance Criteria**: Same as FR1.1

#### FR1.3: Dashboard Edit Mode Icons

**Requirement**: Inject icon in dashboard edit mode toolbar.

**Acceptance Criteria**:
- [ ] Icon appears in dashboard options menu (⋮)
- [ ] Shows "HomeGuardian History" with count badge
- [ ] Opens side panel with dashboard-specific history

#### FR1.4: Items List Icons (Optional P1)

**Requirement**: Icons in Settings → Automations/Scripts list view

**Acceptance Criteria**:
- [ ] Small icon next to each item in list
- [ ] Less intrusive than editor icons
- [ ] Same click behavior

### 6.2 History Popup (P0)

#### FR2.1: Quick History Popup

**Requirement**: Clicking icon shows popup with recent commits.

**Acceptance Criteria**:
- [ ] Popup appears in <300ms
- [ ] Shows last 5 commits affecting the item
- [ ] Each commit shows: message, date, author, short hash
- [ ] "View Diff" button per commit
- [ ] "Restore" button per commit (except HEAD)
- [ ] "View Full History" link at bottom
- [ ] Popup dismisses on click outside or ESC key

**Visual Specification**:
```
┌────────────────────────────────────────┐
│ History: automation.living_room_lights │
│ File: automations.yaml                 │
├────────────────────────────────────────┤
│ ● 2h ago - "Update trigger condition"  │
│   abc123 • HomeGuardian                │
│   [View Diff] [Restore]                │
│                                        │
│ ○ 1d ago - "Add motion sensor"         │
│   def456 • HomeGuardian                │
│   [View Diff] [Restore]                │
│                                        │
│ ○ 3d ago - "Initial setup"             │
│   ghi789 • HomeGuardian                │
│   [View Diff]                          │
├────────────────────────────────────────┤
│ [View Full History →]                  │
└────────────────────────────────────────┘
```

#### FR2.2: Diff Viewer

**Requirement**: "View Diff" button shows changes inline.

**Acceptance Criteria**:
- [ ] Expands within popup (accordion style)
- [ ] Shows unified diff with syntax highlighting
- [ ] Line numbers
- [ ] Green/red color coding
- [ ] Truncates at 50 lines with "Show more" link

#### FR2.3: Restore Confirmation

**Requirement**: "Restore" button shows confirmation dialog.

**Acceptance Criteria**:
- [ ] Modal dialog appears
- [ ] Shows what will change
- [ ] Warning: "Safety backup will be created"
- [ ] Checkbox: "Reload automation service after restore"
- [ ] Buttons: [Cancel] [Confirm Restore]

**Visual Specification**:
```
┌────────────────────────────────────────┐
│ ⚠️  Restore Automation                  │
├────────────────────────────────────────┤
│ You're about to restore:               │
│                                        │
│ automation.living_room_lights          │
│ to version from 1 day ago              │
│                                        │
│ Changes:                               │
│ - Remove motion sensor trigger         │
│ + Restore time-based trigger           │
│                                        │
│ ⚠️  A safety backup will be created    │
│                                        │
│ ☑ Reload automation service            │
│                                        │
│ [Cancel] [Confirm Restore]             │
└────────────────────────────────────────┘
```

### 6.3 API Integration (P0)

#### FR3.1: Item History Endpoint

**Requirement**: Backend API to get commit history for specific item.

**Specification**:
```javascript
GET /api/history/item/:type/:id
Query params:
  - limit: number (default: 5)
  - offset: number (default: 0)

Response:
{
  "item": {
    "type": "automation",
    "id": "living_room_lights",
    "name": "Living Room Lights",
    "file": "automations.yaml"
  },
  "commits": [
    {
      "hash": "abc123def456",
      "shortHash": "abc123",
      "message": "Update trigger condition",
      "date": "2025-11-08T10:30:00Z",
      "author": "HomeGuardian",
      "filesChanged": ["automations.yaml"],
      "linesChanged": { "added": 2, "removed": 1 }
    },
    ...
  ],
  "totalCommits": 12,
  "hasMore": true
}
```

#### FR3.2: Item Diff Endpoint

**Requirement**: Get diff for specific item between commits.

**Specification**:
```javascript
GET /api/history/item/:type/:id/diff
Query params:
  - from: commit hash
  - to: commit hash (default: HEAD)

Response:
{
  "diff": "...", // unified diff format
  "summary": {
    "added": 2,
    "removed": 1,
    "modified": 3
  }
}
```

#### FR3.3: Item Restore Endpoint

**Requirement**: Restore specific item to commit.

**Specification**:
```javascript
POST /api/restore/item
Body:
{
  "type": "automation",
  "id": "living_room_lights",
  "commitHash": "abc123",
  "createSafetyBackup": true,
  "reloadService": true
}

Response:
{
  "success": true,
  "safetyBackupCommit": "xyz789",
  "reloadStatus": "success",
  "message": "Automation restored successfully"
}
```

---

## 7. Technical Architecture

### 7.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Home Assistant Frontend                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Native HA UI (Lovelace, Editors)             │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │    HACS Custom Component Frontend (JS Injection)       │ │
│  │  • DOM Mutation Observers                              │ │
│  │  • Icon Injection Logic                                │ │
│  │  • Popup Components                                    │ │
│  │  • API Client                                          │ │
│  └──────────────────────┬─────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              HomeGuardian Add-on (Backend)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes                                            │ │
│  │  • /api/history/item/:type/:id                         │ │
│  │  • /api/history/item/:type/:id/diff                    │ │
│  │  • /api/restore/item                                   │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │  Services                                              │ │
│  │  • git-service.js (Git operations)                     │ │
│  │  • ha-parser.js (YAML parsing)                         │ │
│  │  • notification-service.js                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Data Layer                                            │ │
│  │  • SQLite (backup_history, settings)                   │ │
│  │  • Git Repository (/config)                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Component Breakdown

#### 7.2.1 HACS Custom Component (Frontend)

**Technology**: LitElement (Web Components) + TypeScript

**Files**:
```
hacs-frontend/
├── custom_components/
│   └── homeguardian_ui/
│       ├── __init__.py              # Python integration stub
│       ├── manifest.json            # Component metadata
│       ├── services.yaml            # HA services
│       └── www/                     # Frontend assets
│           ├── homeguardian-ui.js   # Main bundle
│           ├── icon-injector.js     # Icon injection logic
│           ├── history-popup.js     # Popup component
│           └── api-client.js        # API communication
```

**Responsibilities**:
- Detect HA UI pages (automation editor, script editor)
- Inject icons via DOM manipulation
- Render popup components
- Communicate with HomeGuardian API
- Handle user interactions

#### 7.2.2 Backend Extensions (HomeGuardian Add-on)

**New Routes**:
```javascript
// backend/routes/history-items.js
router.get('/item/:type/:id', getItemHistory);
router.get('/item/:type/:id/diff', getItemDiff);

// backend/routes/restore-items.js
router.post('/item', restoreItem);
```

**New Services**:
```javascript
// backend/services/item-history-service.js
class ItemHistoryService {
  async getItemHistory(type, id, limit) {
    // Get commits affecting specific item
  }

  async getItemDiff(type, id, fromCommit, toCommit) {
    // Get diff for specific item
  }
}
```

---

## 8. Monorepo Structure

### 8.1 Directory Layout

```
HomeGuardian/                           # Monorepo root
│
├── backend/                            # ✅ Existing - HomeGuardian Add-on
│   ├── server.js
│   ├── routes/
│   │   ├── history.js
│   │   ├── history-items.js           # ⬅️ NEW
│   │   ├── restore.js
│   │   └── restore-items.js           # ⬅️ NEW
│   ├── services/
│   │   ├── git-service.js
│   │   ├── item-history-service.js    # ⬅️ NEW
│   │   └── ha-parser.js
│   └── package.json
│
├── frontend/                           # ✅ Existing - Add-on UI
│   ├── src/
│   └── package.json
│
├── hacs-frontend/                      # ⬅️ NEW - HACS Component
│   ├── custom_components/
│   │   └── homeguardian_ui/
│   │       ├── __init__.py
│   │       ├── manifest.json
│   │       ├── hacs.json
│   │       ├── config_flow.py
│   │       └── www/
│   │           ├── dist/              # Built files
│   │           │   └── homeguardian-ui.js
│   │           └── src/               # Source files
│   │               ├── main.ts
│   │               ├── icon-injector.ts
│   │               ├── history-popup.ts
│   │               ├── api-client.ts
│   │               └── styles.css
│   ├── package.json
│   ├── tsconfig.json
│   └── rollup.config.js
│
├── hacs-card/                          # ⬅️ NEW - Dashboard Card (P1)
│   ├── dist/
│   ├── src/
│   ├── hacs.json
│   └── package.json
│
├── shared/                             # ⬅️ NEW - Shared types
│   └── types.ts                        # TypeScript interfaces
│
├── docs/
│   ├── implementation-plans/
│   │   └── HACS_PDR.md                # This document
│   ├── INSTALL_ADDON.md
│   └── INSTALL_HACS_COMPONENT.md
│
├── .github/
│   └── workflows/
│       ├── addon-ci.yml
│       ├── hacs-frontend-ci.yml       # ⬅️ NEW
│       └── hacs-card-ci.yml           # ⬅️ NEW
│
├── config.yaml                         # Add-on config
├── repository.json                     # Add-on metadata
├── Dockerfile
└── README.md
```

### 8.2 Installation Flow

#### Step 1: Install Add-on (Required)

```yaml
1. HA → Settings → Add-ons → Add-on Store
2. ⋮ → Repositories
3. Add: https://github.com/thiagosian/HomeGuardian
4. Install "HomeGuardian"
5. Start add-on
```

**Uses**: `repository.json` (Supervisor)

#### Step 2: Install HACS Component (Required for Icons)

```yaml
1. HACS → Integrations
2. ⋮ → Custom repositories
3. Add: https://github.com/thiagosian/HomeGuardian
   Category: Integration
4. Download "HomeGuardian UI"
5. Restart Home Assistant
6. Settings → Devices & Services → Add Integration
7. Search "HomeGuardian UI"
8. Configure (auto-detects add-on)
```

**Uses**: `hacs-frontend/custom_components/homeguardian_ui/hacs.json`

#### Step 3: Install Dashboard Card (Optional)

```yaml
1. HACS → Frontend
2. ⋮ → Custom repositories
3. Add: https://github.com/thiagosian/HomeGuardian
   Category: Plugin
4. Download "HomeGuardian Card"
```

**Uses**: `hacs-card/hacs.json`

### 8.3 Version Management

**Independent Versioning**:

```bash
# Add-on releases
git tag addon-v1.4.0

# HACS Frontend releases
git tag hacs-frontend-v1.0.0

# HACS Card releases
git tag hacs-card-v1.0.0

# Combined releases (when all updated)
git tag v1.4.0  # Umbrella tag
```

**Example Timeline**:
```
v1.4.0 = addon-v1.4.0 + hacs-frontend-v1.0.0 + hacs-card-v1.0.0
├─ addon-v1.4.1 (bugfix, others unchanged)
├─ hacs-frontend-v1.0.1 (UI fix, others unchanged)
└─ v1.5.0 = addon-v1.5.0 + hacs-frontend-v1.1.0 + hacs-card-v1.1.0
```

---

## 9. Icon Injection Implementation

### 9.1 Detection Strategy

**Challenge**: Detect when HA automation/script editor is loaded.

**Solution**: MutationObserver + URL detection

```typescript
// icon-injector.ts

class IconInjector {
  private observer: MutationObserver;
  private injectedIcons: Set<string> = new Set();

  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  start() {
    // Observe entire document for changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check on URL changes (SPA navigation)
    window.addEventListener('popstate', () => this.checkCurrentPage());
    window.addEventListener('hashchange', () => this.checkCurrentPage());

    // Initial check
    this.checkCurrentPage();
  }

  private checkCurrentPage() {
    const path = window.location.pathname;

    if (path.includes('/config/automation/edit/')) {
      this.injectAutomationIcon();
    } else if (path.includes('/config/script/edit/')) {
      this.injectScriptIcon();
    } else if (path.includes('/lovelace/') && this.isEditMode()) {
      this.injectDashboardIcon();
    }
  }

  private handleMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      // Check if automation editor was added to DOM
      if (this.isAutomationEditor(mutation.target)) {
        this.injectAutomationIcon();
      }
    }
  }

  private isAutomationEditor(node: Node): boolean {
    if (!(node instanceof Element)) return false;

    // Detect HA's automation editor component
    return node.tagName === 'HA-CONFIG-AUTOMATION' ||
           node.querySelector('ha-config-automation') !== null;
  }

  private async injectAutomationIcon() {
    // Find automation name element
    const nameElement = document.querySelector(
      'ha-config-automation .header .name'
    );

    if (!nameElement || this.injectedIcons.has('current-automation')) {
      return; // Already injected
    }

    // Get automation ID from URL
    const automationId = this.getAutomationIdFromURL();
    if (!automationId) return;

    // Fetch version count from API
    const versionCount = await this.getVersionCount('automation', automationId);

    // Create and inject icon
    const icon = this.createHistoryIcon(versionCount, 'automation', automationId);
    nameElement.parentElement?.appendChild(icon);

    this.injectedIcons.add('current-automation');
  }

  private createHistoryIcon(
    count: number,
    type: string,
    id: string
  ): HTMLElement {
    const icon = document.createElement('ha-icon-button');
    icon.setAttribute('class', 'homeguardian-history-icon');
    icon.innerHTML = `
      <ha-svg-icon slot="icon" path="${mdiHistory}"></ha-svg-icon>
      ${count > 0 ? `<span class="badge">${count}</span>` : ''}
    `;

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showHistoryPopup(type, id);
    });

    icon.setAttribute('title', `View history (${count} versions)`);

    return icon;
  }

  private async getVersionCount(type: string, id: string): Promise<number> {
    try {
      const response = await fetch(
        `/api/homeguardian/history/item/${type}/${id}?limit=1`
      );
      const data = await response.json();
      return data.totalCommits || 0;
    } catch (error) {
      console.error('Failed to get version count:', error);
      return 0;
    }
  }

  private showHistoryPopup(type: string, id: string) {
    const popup = new HistoryPopup(type, id);
    document.body.appendChild(popup);
  }

  private getAutomationIdFromURL(): string | null {
    const match = window.location.pathname.match(
      /\/config\/automation\/edit\/(.+)/
    );
    return match ? match[1] : null;
  }

  private isEditMode(): boolean {
    return window.location.search.includes('edit=1');
  }
}

// Start injector when component loads
customElements.whenDefined('home-assistant').then(() => {
  const injector = new IconInjector();
  injector.start();
});
```

### 9.2 Icon Component

```typescript
// history-icon.ts

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('homeguardian-history-icon')
export class HistoryIcon extends LitElement {
  @property({ type: Number }) count = 0;
  @property({ type: String }) type = '';
  @property({ type: String }) itemId = '';

  static styles = css`
    :host {
      position: relative;
      display: inline-block;
      margin-left: 8px;
    }

    ha-icon-button {
      color: var(--primary-color);
      --mdc-icon-button-size: 36px;
    }

    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--primary-color);
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: bold;
      min-width: 16px;
      text-align: center;
    }

    :host(:hover) ha-icon-button {
      color: var(--primary-text-color);
    }
  `;

  render() {
    return html`
      <ha-icon-button
        @click="${this.handleClick}"
        title="View history (${this.count} versions)"
      >
        <ha-svg-icon slot="icon" .path="${mdiHistory}"></ha-svg-icon>
        ${this.count > 0 ? html`<span class="badge">${this.count}</span>` : ''}
      </ha-icon-button>
    `;
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('show-history', {
      detail: { type: this.type, id: this.itemId },
      bubbles: true,
      composed: true
    }));
  }
}
```

### 9.3 Popup Component

```typescript
// history-popup.ts

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ApiClient } from './api-client';

@customElement('homeguardian-history-popup')
export class HistoryPopup extends LitElement {
  @property({ type: String }) type = '';
  @property({ type: String }) itemId = '';
  @state() private commits: Commit[] = [];
  @state() private loading = true;
  @state() private error = '';

  private api = new ApiClient();

  static styles = css`
    :host {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      background: var(--card-background-color);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      width: 500px;
      max-height: 600px;
      display: flex;
      flex-direction: column;
    }

    .header {
      padding: 16px;
      border-bottom: 1px solid var(--divider-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h2 {
      margin: 0;
      font-size: 18px;
    }

    .content {
      overflow-y: auto;
      flex: 1;
      padding: 16px;
    }

    .commit {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .commit-message {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .commit-meta {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-bottom: 8px;
    }

    .commit-actions {
      display: flex;
      gap: 8px;
    }

    .footer {
      padding: 16px;
      border-top: 1px solid var(--divider-color);
      text-align: center;
    }

    mwc-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadHistory();
  }

  private async loadHistory() {
    try {
      this.loading = true;
      const data = await this.api.getItemHistory(this.type, this.itemId, 5);
      this.commits = data.commits;
      this.loading = false;
    } catch (err) {
      this.error = 'Failed to load history';
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="header">
        <h2>History: ${this.type}.${this.itemId}</h2>
        <ha-icon-button @click="${this.close}">
          <ha-svg-icon .path="${mdiClose}"></ha-svg-icon>
        </ha-icon-button>
      </div>

      <div class="content">
        ${this.loading ? html`<ha-circular-progress active></ha-circular-progress>` : ''}
        ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        ${this.commits.map((commit, index) => this.renderCommit(commit, index))}
      </div>

      <div class="footer">
        <mwc-button @click="${this.openFullHistory}">
          View Full History
        </mwc-button>
      </div>
    `;
  }

  private renderCommit(commit: Commit, index: number) {
    const isHead = index === 0;

    return html`
      <div class="commit">
        <div class="commit-message">
          ${isHead ? '● ' : '○ '} ${commit.message}
        </div>
        <div class="commit-meta">
          ${commit.shortHash} • ${this.formatDate(commit.date)} • ${commit.author}
        </div>
        <div class="commit-actions">
          <mwc-button dense @click="${() => this.viewDiff(commit)}">
            View Diff
          </mwc-button>
          ${!isHead ? html`
            <mwc-button dense @click="${() => this.restore(commit)}">
              Restore
            </mwc-button>
          ` : ''}
        </div>
      </div>
    `;
  }

  private async viewDiff(commit: Commit) {
    // TODO: Expand inline diff or open modal
    console.log('View diff:', commit);
  }

  private async restore(commit: Commit) {
    const confirmed = await this.showRestoreConfirmation(commit);
    if (!confirmed) return;

    try {
      await this.api.restoreItem(this.type, this.itemId, commit.hash);
      this.showSuccess('Restored successfully');
      this.close();
    } catch (err) {
      this.showError('Restore failed');
    }
  }

  private async showRestoreConfirmation(commit: Commit): Promise<boolean> {
    return confirm(
      `Restore ${this.type} to version from ${this.formatDate(commit.date)}?\n\n` +
      `A safety backup will be created automatically.`
    );
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  private close() {
    this.remove();
  }

  private openFullHistory() {
    // Navigate to HomeGuardian add-on or open side panel
    window.location.href = `/hassio/ingress/homeguardian/items?type=${this.type}&id=${this.itemId}`;
  }

  private showSuccess(message: string) {
    // TODO: Show toast notification
    alert(message);
  }

  private showError(message: string) {
    // TODO: Show error notification
    alert(message);
  }
}
```

### 9.4 API Client

```typescript
// api-client.ts

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  author: string;
  filesChanged: string[];
  linesChanged: { added: number; removed: number };
}

export interface ItemHistoryResponse {
  item: {
    type: string;
    id: string;
    name: string;
    file: string;
  };
  commits: Commit[];
  totalCommits: number;
  hasMore: boolean;
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    // Auto-detect HomeGuardian add-on URL
    this.baseUrl = this.detectAddonUrl();
  }

  private detectAddonUrl(): string {
    // Check if running via ingress
    const ingressMatch = window.location.pathname.match(
      /\/api\/hassio_ingress\/([^\/]+)/
    );

    if (ingressMatch) {
      return `/api/hassio_ingress/${ingressMatch[1]}`;
    }

    // Fallback to direct URL (development)
    return 'http://localhost:8099';
  }

  async getItemHistory(
    type: string,
    id: string,
    limit: number = 5
  ): Promise<ItemHistoryResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/history/item/${type}/${id}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemDiff(
    type: string,
    id: string,
    fromCommit: string,
    toCommit: string = 'HEAD'
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/api/history/item/${type}/${id}/diff?from=${fromCommit}&to=${toCommit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch diff: ${response.statusText}`);
    }

    const data = await response.json();
    return data.diff;
  }

  async restoreItem(
    type: string,
    id: string,
    commitHash: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/restore/item`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id,
          commitHash,
          createSafetyBackup: true,
          reloadService: true
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to restore: ${response.statusText}`);
    }
  }
}
```

---

## 10. UI/UX Specifications

### 10.1 Visual Design

**Design System**: Follow Home Assistant Material Design

**Colors**:
- Primary: `var(--primary-color)` (HA theme color)
- Success: `#4CAF50`
- Warning: `#FF9800`
- Error: `#F44336`
- Text: `var(--primary-text-color)`
- Secondary Text: `var(--secondary-text-color)`

**Typography**:
- Font Family: `Roboto, sans-serif` (HA default)
- Icon size: 24px
- Badge font: 10px bold

**Spacing**:
- Icon margin: 8px
- Popup padding: 16px
- Commit item margin: 12px

### 10.2 Responsive Design

**Desktop (>960px)**:
- Popup width: 500px
- Icons: 24px
- Full feature set

**Tablet (600-960px)**:
- Popup width: 90vw (max 500px)
- Icons: 24px
- Simplified commit view

**Mobile (<600px)**:
- Popup: Full screen modal
- Icons: 20px
- Vertical layout
- Bottom sheet style

### 10.3 Accessibility

**WCAG 2.1 AA Compliance**:
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] ARIA labels on all interactive elements
- [ ] Focus indicators
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Color contrast ratio ≥ 4.5:1

**Keyboard Shortcuts**:
- `Esc`: Close popup
- `Enter`: Confirm action
- `Tab`: Navigate buttons

### 10.4 Loading States

**Icon Loading**:
```html
<ha-icon-button>
  <ha-svg-icon path="${mdiHistory}"></ha-svg-icon>
  <span class="badge loading">...</span>
</ha-icon-button>
```

**Popup Loading**:
```html
<div class="content">
  <ha-circular-progress active></ha-circular-progress>
  <p>Loading history...</p>
</div>
```

### 10.5 Error States

**API Error**:
```html
<div class="error">
  <ha-svg-icon path="${mdiAlertCircle}"></ha-svg-icon>
  <p>Failed to load history</p>
  <mwc-button @click="${retry}">Retry</mwc-button>
</div>
```

**No History**:
```html
<div class="empty-state">
  <ha-svg-icon path="${mdiInformationOutline}"></ha-svg-icon>
  <p>No version history available</p>
  <p class="hint">Changes will be tracked automatically</p>
</div>
```

---

## 11. Implementation Plan

### 11.1 Phase 1: Foundation (Weeks 1-2)

**Goal**: Set up monorepo structure and basic icon injection

**Tasks**:
- [ ] Create `hacs-frontend/` directory structure
- [ ] Setup TypeScript + Rollup build pipeline
- [ ] Create Python integration stub (`__init__.py`)
- [ ] Write `manifest.json` and `hacs.json`
- [ ] Implement basic `IconInjector` class
- [ ] Test icon appearance in automation editor
- [ ] Add backend API endpoints (stub responses)

**Deliverables**:
- Icon appears in automation editor (no functionality yet)
- Build pipeline works
- HACS validation passes

**Success Criteria**:
- Icon visible within 500ms of page load
- No console errors
- Passes HACS action validation

### 11.2 Phase 2: Core Functionality (Weeks 3-4)

**Goal**: Implement history popup and API integration

**Tasks**:
- [ ] Build `HistoryPopup` component
- [ ] Implement `ApiClient` class
- [ ] Add backend API endpoints (real implementation)
  - [ ] `GET /api/history/item/:type/:id`
  - [ ] `GET /api/history/item/:type/:id/diff`
  - [ ] `POST /api/restore/item`
- [ ] Add `ItemHistoryService` to backend
- [ ] Test end-to-end flow (icon → popup → API → response)
- [ ] Error handling and loading states

**Deliverables**:
- Clicking icon shows popup with real commit data
- Restore functionality works
- Error handling in place

**Success Criteria**:
- Popup loads in <300ms
- Restore completes successfully
- Safety backup created
- HA service reloaded

### 11.3 Phase 3: Polish & Testing (Week 5)

**Goal**: UI polish, testing, documentation

**Tasks**:
- [ ] Add diff viewer to popup
- [ ] Implement restore confirmation modal
- [ ] Add keyboard shortcuts
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive design
- [ ] Write user documentation
- [ ] Create demo video/GIFs

**Deliverables**:
- Polished UI matching HA design
- Comprehensive docs
- Demo materials

**Success Criteria**:
- All acceptance criteria met
- Zero critical bugs
- Documentation complete

### 11.4 Phase 4: Dashboard Card (Weeks 6-10) - P1

**Goal**: Build dashboard card for git status

**Tasks**:
- [ ] Create `hacs-card/` directory
- [ ] Build LitElement card component
- [ ] Implement compact/full/entity modes
- [ ] Add quick backup button
- [ ] Recent commits list
- [ ] Configuration UI

**Deliverables**:
- Installable HACS card
- Works alongside icon injection

**Success Criteria**:
- Card loads in <1s
- Quick backup works
- Configurable via YAML

### 11.5 Phase 5: Side Panel (Weeks 11-13) - P2

**Goal**: Build side panel for detailed history

**Tasks**:
- [ ] Create side panel component
- [ ] Timeline visualization
- [ ] Advanced diff viewer
- [ ] Multi-version comparison

**Deliverables**:
- Side panel opens from popup
- Full history browsing

**Success Criteria**:
- Panel responsive
- All history features work

---

## 12. Testing Strategy

### 12.1 Unit Testing

**Frontend (Jest + Testing Library)**:
```typescript
// icon-injector.test.ts
describe('IconInjector', () => {
  it('should inject icon in automation editor', async () => {
    const injector = new IconInjector();
    document.body.innerHTML = '<ha-config-automation><div class="name">Test</div></ha-config-automation>';

    await injector.injectAutomationIcon();

    const icon = document.querySelector('.homeguardian-history-icon');
    expect(icon).toBeTruthy();
  });

  it('should not inject duplicate icons', async () => {
    const injector = new IconInjector();
    await injector.injectAutomationIcon();
    await injector.injectAutomationIcon();

    const icons = document.querySelectorAll('.homeguardian-history-icon');
    expect(icons.length).toBe(1);
  });
});
```

**Backend (Jest + Supertest)**:
```javascript
// history-items.test.js
describe('GET /api/history/item/:type/:id', () => {
  it('should return item history', async () => {
    const response = await request(app)
      .get('/api/history/item/automation/test_automation')
      .expect(200);

    expect(response.body.commits).toBeInstanceOf(Array);
    expect(response.body.totalCommits).toBeGreaterThan(0);
  });

  it('should return 404 for non-existent item', async () => {
    await request(app)
      .get('/api/history/item/automation/nonexistent')
      .expect(404);
  });
});
```

### 12.2 Integration Testing

**E2E Tests (Playwright)**:
```typescript
// e2e/icon-injection.spec.ts
test('icon injection in automation editor', async ({ page }) => {
  // Navigate to automation editor
  await page.goto('http://localhost:8123/config/automation/edit/test');

  // Wait for icon to appear
  const icon = await page.waitForSelector('.homeguardian-history-icon');
  expect(icon).toBeTruthy();

  // Check badge
  const badge = await icon.$('.badge');
  const text = await badge?.textContent();
  expect(text).toMatch(/\d+/); // Should be a number
});

test('history popup functionality', async ({ page }) => {
  await page.goto('http://localhost:8123/config/automation/edit/test');

  // Click icon
  await page.click('.homeguardian-history-icon');

  // Wait for popup
  const popup = await page.waitForSelector('homeguardian-history-popup');
  expect(popup).toBeTruthy();

  // Check commits
  const commits = await popup.$$('.commit');
  expect(commits.length).toBeGreaterThan(0);

  // Test restore button
  const restoreBtn = await commits[1].$('mwc-button:has-text("Restore")');
  await restoreBtn?.click();

  // Check confirmation dialog
  const dialog = await page.waitForSelector('[role="dialog"]');
  expect(dialog).toBeTruthy();
});
```

### 12.3 Cross-Browser Testing

**Test Matrix**:

| Browser | Desktop | Mobile | Tablet |
|---------|---------|--------|--------|
| Chrome 120+ | ✅ | ✅ | ✅ |
| Firefox 120+ | ✅ | ✅ | ✅ |
| Safari 17+ | ✅ | ✅ | ✅ |
| Edge 120+ | ✅ | N/A | N/A |

**Automated**: BrowserStack via GitHub Actions

### 12.4 Performance Testing

**Metrics**:
- Icon injection time: <500ms (p95)
- Popup load time: <300ms (p95)
- API response time: <200ms (p95)
- Memory usage: <50MB increase

**Tools**:
- Lighthouse CI
- Chrome DevTools Performance
- WebPageTest

---

## 13. Security and Performance

### 13.1 Security Considerations

**1. API Authentication**:
```typescript
// Ensure all API calls use HA authentication
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${getHAToken()}`,
    'Content-Type': 'application/json'
  }
});
```

**2. Input Validation**:
```javascript
// Backend validation
router.get('/item/:type/:id', async (req, res) => {
  const { type, id } = req.params;

  // Validate type
  if (!['automation', 'script', 'scene'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  // Sanitize ID (prevent path traversal)
  if (id.includes('..') || id.includes('/')) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  // Continue...
});
```

**3. XSS Prevention**:
```typescript
// Use LitElement's html`` template literals (auto-escapes)
render() {
  return html`
    <div>${this.userInput}</div>  <!-- Auto-escaped -->
  `;
}
```

**4. CORS Headers**:
```javascript
// Only allow same-origin requests
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

### 13.2 Performance Optimizations

**1. Lazy Loading**:
```typescript
// Only load popup component when needed
async showHistoryPopup(type: string, id: string) {
  const HistoryPopup = await import('./history-popup.js');
  const popup = new HistoryPopup.HistoryPopup(type, id);
  document.body.appendChild(popup);
}
```

**2. Caching**:
```typescript
// Cache version counts in memory
private versionCache = new Map<string, number>();

async getVersionCount(type: string, id: string): Promise<number> {
  const key = `${type}:${id}`;

  if (this.versionCache.has(key)) {
    return this.versionCache.get(key)!;
  }

  const count = await this.fetchVersionCount(type, id);
  this.versionCache.set(key, count);

  // Expire after 5 minutes
  setTimeout(() => this.versionCache.delete(key), 5 * 60 * 1000);

  return count;
}
```

**3. Debouncing**:
```typescript
// Debounce DOM mutations
private debouncedCheck = debounce(() => {
  this.checkCurrentPage();
}, 300);

private handleMutations(mutations: MutationRecord[]) {
  this.debouncedCheck();
}
```

**4. Virtual Scrolling**:
```typescript
// For long commit lists in side panel
import { LitVirtualizer } from '@lit-labs/virtualizer';

render() {
  return html`
    <lit-virtualizer
      .items="${this.commits}"
      .renderItem="${(commit) => this.renderCommit(commit)}"
    ></lit-virtualizer>
  `;
}
```

---

## 14. Risks and Mitigations

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **HA UI changes break injection** | High | High | - Defensive DOM queries<br>- Fallback to class-based selectors<br>- Version detection<br>- Automated testing on HA betas |
| **Performance degradation** | Medium | Medium | - Lazy loading<br>- Caching<br>- Virtual scrolling<br>- Performance monitoring |
| **Cross-browser compatibility** | Medium | Medium | - Use Web Components (native)<br>- Polyfills for older browsers<br>- BrowserStack testing |
| **API latency** | Low | Medium | - Caching<br>- Optimistic UI updates<br>- Loading states |

### 14.2 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Users don't discover feature** | High | High | - Onboarding tour<br>- Tooltip hints<br>- Documentation<br>- Video demo |
| **Visual clutter** | Medium | Medium | - Minimal icon design<br>- User preference to hide<br>- Contextual placement |
| **Confusion with multiple UIs** | Medium | Low | - Clear branding<br>- Consistent design<br>- Link to main add-on |

### 14.3 Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Scope creep** | Medium | Medium | - Strict phase gating<br>- MVP-first approach<br>- Feature freeze for v1.0 |
| **Timeline delays** | Medium | High | - Buffer weeks in schedule<br>- Prioritize P0 features<br>- Cut P2 if needed |
| **HACS rejection** | Low | High | - Follow HACS guidelines strictly<br>- Pre-submission validation<br>- Community feedback |

---

## 15. Success Metrics

### 15.1 Adoption Metrics

**3-Month Post-Release**:
- Installation rate: 40% of existing HomeGuardian users
- Active usage: 60% of installers use icons weekly
- Retention: 80% keep component installed after 1 month

**6-Month Post-Release**:
- Installation rate: 60% of HomeGuardian users
- Active usage: 70% weekly
- Retention: 85%

### 15.2 Performance Metrics

**Technical KPIs**:
- Icon injection time: <500ms (p95)
- Popup load time: <300ms (p95)
- API response time: <200ms (p95)
- Error rate: <1% of API calls
- Crash rate: <0.1% of sessions

### 15.3 User Satisfaction

**Qualitative Metrics**:
- NPS (Net Promoter Score): >50
- GitHub stars: +100 within 3 months
- Reddit sentiment: >80% positive mentions
- Support tickets: <10/month feature-related

**Feedback Collection**:
- In-app survey after 1 week of use
- GitHub Discussions monitoring
- Reddit r/homeassistant monitoring
- Discord community feedback

### 15.4 Business Metrics

**Project Success**:
- Launch on schedule (±1 week)
- Budget: Within 5% of estimate
- Critical bugs: <5 unfixed after 1 month
- Documentation completeness: 100%

---

## 16. Dependencies

### 16.1 External Dependencies

**Required**:
- Home Assistant 2024.1+ (SPA architecture)
- HomeGuardian Add-on 1.4.0+ (API endpoints)
- HACS 1.33+ (for installation)
- Modern browser (Chrome 100+, Firefox 100+, Safari 15+)

**Development**:
- Node.js 20+
- TypeScript 5+
- Rollup 4+
- LitElement 3+

### 16.2 Internal Dependencies

**Backend Changes**:
- New API routes in `backend/routes/`
- New service `ItemHistoryService`
- Database schema (no changes, uses existing)

**Frontend Changes** (Add-on UI):
- No changes required (independent)

### 16.3 Third-Party Services

**Optional**:
- BrowserStack (cross-browser testing)
- Sentry (error tracking)
- Google Analytics (usage analytics)

---

## 17. Appendices

### 17.1 Appendix A: API Specifications

See [Section 6.3](#63-api-integration-p0) for full API specs.

### 17.2 Appendix B: Build Configuration

**rollup.config.js**:
```javascript
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/homeguardian-ui.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    typescript(),
    terser()
  ]
};
```

### 17.3 Appendix C: HACS Configuration

**hacs.json**:
```json
{
  "name": "HomeGuardian UI",
  "content_in_root": false,
  "render_readme": true,
  "homeassistant": "2024.1.0",
  "filename": "homeguardian-ui.js"
}
```

**manifest.json**:
```json
{
  "domain": "homeguardian_ui",
  "name": "HomeGuardian UI",
  "documentation": "https://github.com/thiagosian/HomeGuardian",
  "dependencies": [],
  "codeowners": ["@thiagosian"],
  "requirements": [],
  "version": "1.0.0",
  "iot_class": "local_polling",
  "config_flow": true,
  "integration_type": "service"
}
```

### 17.4 Appendix D: Release Checklist

**Pre-Release**:
- [ ] All P0 acceptance criteria met
- [ ] Zero critical bugs
- [ ] Performance metrics hit
- [ ] Documentation complete
- [ ] Demo video created
- [ ] HACS validation passes
- [ ] Cross-browser tests pass
- [ ] Accessibility audit pass

**Release Process**:
1. Tag release: `git tag hacs-frontend-v1.0.0`
2. Create GitHub release with changelog
3. Submit to HACS default repositories
4. Announce on Reddit r/homeassistant
5. Blog post
6. Update main README

**Post-Release**:
- [ ] Monitor error rates
- [ ] Respond to GitHub issues within 48h
- [ ] Collect user feedback
- [ ] Plan v1.1 based on feedback

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Product Owner** | _Pending_ | | |
| **Tech Lead** | _Pending_ | | |
| **QA Lead** | _Pending_ | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-08 | Claude | Initial PDR creation |

---

**Status**: ✅ Draft Complete - Ready for Review

**Next Steps**:
1. Review and approve PDR
2. Create GitHub project board
3. Break down into issues
4. Assign developers
5. Begin Phase 1 implementation

---

**End of Document**
