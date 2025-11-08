# PDR ADDENDUM v1.1: Blueprints & Voice Assistants Support

**Complemento ao PDR-HACS-001**

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | PDR-HACS-001-ADD-v1.1 |
| **Version** | 1.1 |
| **Date** | 2025-11-08 |
| **Status** | Active - Extends PDR-HACS-001 v1.0 |
| **Author** | Claude (AI Assistant) |
| **Parent Document** | PDR_HACS_Icon_Injection.md |
| **Change Type** | Feature Addition |

---

## Change Summary

This addendum extends the original PDR to include comprehensive support for **Blueprints** and **Voice Assistants**, ensuring history icons appear across **ALL** Home Assistant entity types.

###

 Original Coverage (v1.0):
- ✅ Automations
- ✅ Scripts
- ✅ Scenes
- ✅ Dashboards (Lovelace)
- ✅ ESPHome devices
- ✅ Packages

### ⬅️ **NEW** Coverage (v1.1):
- ✅ **Blueprints** (automation + script blueprints)
- ✅ **Voice Assistants** (Assist pipelines)

---

## Table of Contents

1. [Blueprints Support](#1-blueprints-support)
2. [Voice Assistants Support](#2-voice-assistants-support)
3. [Updated Entity Type Matrix](#3-updated-entity-type-matrix)
4. [Backend Extensions](#4-backend-extensions)
5. [Frontend Icon Injection](#5-frontend-icon-injection)
6. [API Specifications](#6-api-specifications)
7. [UI/UX Specifications](#7-uiux-specifications)
8. [Implementation Priority](#8-implementation-priority)

---

## 1. Blueprints Support

### 1.1 What are Blueprints?

**Blueprints** in Home Assistant are reusable automation and script templates that users can import and customize. They're stored in:
- `/config/blueprints/automation/` - Automation blueprints
- `/config/blueprints/script/` - Script blueprints

Each blueprint is a YAML file that defines inputs and template logic.

### 1.2 Blueprint File Structure

```yaml
# Example: /config/blueprints/automation/motion_light.yaml
blueprint:
  name: Motion-activated Light
  description: Turn on a light when motion is detected
  domain: automation
  input:
    motion_entity:
      name: Motion Sensor
      selector:
        entity:
          domain: binary_sensor
          device_class: motion
    light_target:
      name: Light
      selector:
        target:
          entity:
            domain: light

trigger:
  - platform: state
    entity_id: !input motion_entity
    to: "on"
action:
  - service: light.turn_on
    target: !input light_target
```

### 1.3 Where Icons Should Appear

#### Location 1: Blueprint Editor

**URL Pattern**: `/config/blueprint/edit/*`

**DOM Target**: Blueprint name in header

**Visual Mockup**:
```
┌──────────────────────────────────────────┐
│ Blueprint: Motion Light  🕐8  [Edit] [⋮] │ ← Icon here
│ Domain: automation                       │
│ Last modified: 3 days ago                │
└──────────────────────────────────────────┘
```

#### Location 2: Blueprints List Page

**URL Pattern**: `/config/blueprint/dashboard`

**DOM Target**: Each blueprint row in the list

**Visual Mockup**:
```
┌──────────────────────────────────────────┐
│ My Blueprints                            │
├──────────────────────────────────────────┤
│ Motion Light           🕐8  [Import] [⋮] │
│ Good Night Script      🕐12 [Import] [⋮] │
│ Climate Control        🕐3  [Import] [⋮] │
└──────────────────────────────────────────┘
```

#### Location 3: Automation "Create from Blueprint" Flow

**URL Pattern**: `/config/automation/new_from_blueprint/*`

**DOM Target**: Blueprint selection card

**Visual Mockup**:
```
┌──────────────────────────────────────────┐
│ Select a Blueprint                       │
├──────────────────────────────────────────┤
│ ○ Motion Light  🕐8                      │
│   Turn on light when motion detected     │
│                                          │
│ ○ Good Night    🕐12                     │
│   Turn off all lights at bedtime         │
└──────────────────────────────────────────┘
```

### 1.4 Backend Parser Extension

```javascript
// backend/services/ha-parser.js

/**
 * Parse Blueprints from blueprints directory
 * @param {boolean} includeRaw - Include raw YAML (default: true)
 */
async parseBlueprints(includeRaw = true) {
  try {
    const items = [];
    const blueprintsDir = path.join(this.configPath, 'blueprints');

    // Check if blueprints directory exists
    const exists = await this.fileExists(blueprintsDir);
    if (!exists) {
      logger.debug('Blueprints directory not found');
      return items;
    }

    // Parse automation blueprints
    const automationBlueprintsDir = path.join(blueprintsDir, 'automation');
    if (await this.fileExists(automationBlueprintsDir)) {
      const autoBlueprints = await this.parseB
lueprintDirectory(
        automationBlueprintsDir,
        'automation',
        includeRaw
      );
      items.push(...autoBlueprints);
    }

    // Parse script blueprints
    const scriptBlueprintsDir = path.join(blueprintsDir, 'script');
    if (await this.fileExists(scriptBlueprintsDir)) {
      const scriptBlueprints = await this.parseBlueprintDirectory(
        scriptBlueprintsDir,
        'script',
        includeRaw
      );
      items.push(...scriptBlueprints);
    }

    logger.info(`Parsed ${items.length} blueprint(s)`);
    return items;
  } catch (error) {
    logger.error('Failed to parse blueprints:', error);
    return [];
  }
}

/**
 * Parse blueprint files in a directory
 */
async parseBlueprintDirectory(dirPath, domain, includeRaw) {
  const items = [];
  const files = await fs.readdir(dirPath, { withFileTypes: true });

  for (const file of files) {
    // Handle subdirectories (e.g., blueprints/automation/homeassistant/)
    if (file.isDirectory()) {
      const subDirPath = path.join(dirPath, file.name);
      const subItems = await this.parseBlueprintDirectory(
        subDirPath,
        domain,
        includeRaw
      );
      items.push(...subItems);
      continue;
    }

    // Parse YAML files
    if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
      const filePath = path.join(dirPath, file.name);

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = yaml.load(content);

        if (data && data.blueprint) {
          const relativePath = path.relative(
            path.join(this.configPath, 'blueprints'),
            filePath
          );

          items.push({
            id: this.generateBlueprintId(relativePath),
            type: 'blueprint',
            domain: domain, // 'automation' or 'script'
            name: data.blueprint.name || file.name.replace(/\.ya?ml$/, ''),
            description: data.blueprint.description || '',
            source: data.blueprint.source_url || 'local',
            inputs: Object.keys(data.blueprint.input || {}),
            file: path.join('blueprints', relativePath),
            ...(includeRaw && { raw: data })
          });
        }
      } catch (error) {
        logger.warn(`Failed to parse blueprint ${file.name}: ${error.message}`);
      }
    }
  }

  return items;
}

/**
 * Generate unique blueprint ID from file path
 */
generateBlueprintId(relativePath) {
  // Convert path to ID: automation/homeassistant/motion_light.yaml
  // → automation_homeassistant_motion_light
  return relativePath
    .replace(/\.ya?ml$/, '')
    .replace(/\//g, '_')
    .replace(/-/g, '_');
}
```

### 1.5 Functional Requirements

**FR-BP1: Blueprint Editor Icon**

**Requirement**: Inject history icon in blueprint editor header

**Acceptance Criteria**:
- [ ] Icon appears next to blueprint name
- [ ] Shows version count badge
- [ ] Click opens history popup
- [ ] Works for both automation and script blueprints

**FR-BP2: Blueprint List Icons**

**Requirement**: Icons in blueprint dashboard list view

**Acceptance Criteria**:
- [ ] Icon appears in each blueprint row
- [ ] Tooltip shows "N versions"
- [ ] Click behavior same as editor

---

## 2. Voice Assistants Support

### 2.1 What are Voice Assistants?

**Voice Assistants** (Assist) in Home Assistant allow users to create custom voice command pipelines. Configurations are typically stored in:
- `.storage/assist_pipeline` (JSON format)
- `configuration.yaml` (conversation config)

### 2.2 Voice Assistant Configuration Structure

**Storage Format** (`.storage/assist_pipeline`):
```json
{
  "version": 1,
  "minor_version": 1,
  "key": "assist_pipeline",
  "data": {
    "pipelines": [
      {
        "conversation_engine": "homeassistant",
        "conversation_language": "en",
        "id": "01HXX...",
        "language": "en",
        "name": "Home Assistant",
        "stt_engine": "cloud",
        "stt_language": "en-US",
        "tts_engine": "cloud",
        "tts_language": "en-US",
        "tts_voice": "en-US-Neural2-A",
        "wake_word_entity": null,
        "wake_word_id": null
      },
      {
        "id": "custom_pipeline_1",
        "name": "Kitchen Assistant",
        "conversation_engine": "conversation",
        "stt_engine": "whisper",
        "tts_engine": "piper",
        ...
      }
    ]
  }
}
```

**YAML Format** (conversation intents in `configuration.yaml`):
```yaml
conversation:
  intents:
    TurnOnLight:
      - "turn on the [light]"
      - "lights on in [room]"
    PlayMusic:
      - "play some music"
      - "start playlist [name]"
```

### 2.3 Where Icons Should Appear

#### Location 1: Voice Assistant Settings

**URL Pattern**: `/config/voice-assistants/assistants`

**DOM Target**: Pipeline configuration list

**Visual Mockup**:
```
┌──────────────────────────────────────────┐
│ Voice Assistants                         │
├──────────────────────────────────────────┤
│ Home Assistant (default)  🕐5  [Edit] [⋮]│
│ Kitchen Assistant         🕐8  [Edit] [⋮]│
│ Bedroom Voice             🕐3  [Edit] [⋮]│
└──────────────────────────────────────────┘
```

#### Location 2: Conversation Intent Editor

**URL Pattern**: `/config/voice-assistants/conversation`

**DOM Target**: Intent configuration section

**Visual Mockup**:
```
┌──────────────────────────────────────────┐
│ Conversation Intents      🕐12           │
├──────────────────────────────────────────┤
│ TurnOnLight                              │
│   - "turn on the [light]"                │
│                                          │
│ PlayMusic                                │
│   - "play some music"                    │
└──────────────────────────────────────────┘
```

### 2.4 Backend Parser Extension

```javascript
// backend/services/ha-parser.js

/**
 * Parse Voice Assistant pipelines from .storage
 */
async parseVoiceAssistants(includeRaw = true) {
  try {
    const items = [];
    const pipelineFile = path.join(
      this.configPath,
      '.storage/assist_pipeline'
    );

    const exists = await this.fileExists(pipelineFile);
    if (!exists) {
      logger.debug('Voice assistant pipeline file not found');
      return items;
    }

    const content = await fs.readFile(pipelineFile, 'utf8');
    const data = JSON.parse(content);

    if (data.data && data.data.pipelines) {
      data.data.pipelines.forEach((pipeline, index) => {
        items.push({
          id: pipeline.id || `pipeline_${index}`,
          type: 'voice_assistant',
          name: pipeline.name || `Pipeline ${index + 1}`,
          description: `${pipeline.conversation_engine} | ${pipeline.stt_engine} → ${pipeline.tts_engine}`,
          language: pipeline.language || 'en',
          stt_engine: pipeline.stt_engine,
          tts_engine: pipeline.tts_engine,
          conversation_engine: pipeline.conversation_engine,
          file: '.storage/assist_pipeline',
          index: index,
          ...(includeRaw && { raw: pipeline })
        });
      });
    }

    logger.info(`Parsed ${items.length} voice assistant pipeline(s)`);
    return items;
  } catch (error) {
    logger.error('Failed to parse voice assistants:', error);
    return [];
  }
}

/**
 * Parse conversation intents from configuration.yaml
 */
async parseConversationIntents(includeRaw = true) {
  try {
    const items = [];
    const configFile = path.join(this.configPath, 'configuration.yaml');

    const exists = await this.fileExists(configFile);
    if (!exists) {
      return items;
    }

    const content = await fs.readFile(configFile, 'utf8');
    const config = yaml.load(content);

    if (config.conversation && config.conversation.intents) {
      Object.entries(config.conversation.intents).forEach(([intentName, phrases]) => {
        items.push({
          id: intentName.toLowerCase().replace(/\s+/g, '_'),
          type: 'conversation_intent',
          name: intentName,
          description: `${phrases.length} phrase(s)`,
          phrases: phrases,
          file: 'configuration.yaml',
          ...(includeRaw && { raw: { [intentName]: phrases } })
        });
      });
    }

    logger.info(`Parsed ${items.length} conversation intent(s)`);
    return items;
  } catch (error) {
    logger.error('Failed to parse conversation intents:', error);
    return [];
  }
}
```

### 2.5 Functional Requirements

**FR-VA1: Voice Assistant Pipeline Icon**

**Requirement**: Inject history icon in voice assistant list

**Acceptance Criteria**:
- [ ] Icon appears next to each pipeline name
- [ ] Shows version count
- [ ] Click opens history popup
- [ ] Works for all pipeline types (cloud, local, hybrid)

**FR-VA2: Conversation Intent Icon**

**Requirement**: Icon in conversation settings

**Acceptance Criteria**:
- [ ] Icon appears in conversation section header
- [ ] Shows combined history of all intents
- [ ] Separate icons for individual intents (optional P1)

---

## 3. Updated Entity Type Matrix

### 3.1 Complete Entity Type Coverage

| Entity Type | File Location | Parse Function | Icon Locations | Priority |
|-------------|---------------|----------------|----------------|----------|
| **Automation** | `automations.yaml` | `parseAutomations()` | Editor, List | P0 |
| **Script** | `scripts.yaml` | `parseScripts()` | Editor, List | P0 |
| **Scene** | `scenes.yaml` | `parseScenes()` | Editor, List | P0 |
| **Blueprint** | `blueprints/*/` | `parseBlueprints()` ⬅️ NEW | Editor, List, Import | P0 |
| **Voice Assistant** | `.storage/assist_pipeline` | `parseVoiceAssistants()` ⬅️ NEW | Settings, List | P0 |
| **Conversation Intent** | `configuration.yaml` | `parseConversationIntents()` ⬅️ NEW | Settings | P1 |
| **Dashboard** | `.storage/lovelace*` | `parseLovelaceDashboards()` | Edit Mode, List | P0 |
| **ESPHome** | `esphome/*.yaml` | `parseESPHome()` | Dashboard (optional) | P1 |
| **Package** | `packages/*.yaml` | `parsePackages()` | List (optional) | P2 |

### 3.2 Detection Matrix

| Entity Type | URL Pattern | DOM Selector | Detection Method |
|-------------|-------------|--------------|------------------|
| **Automation** | `/config/automation/edit/*` | `ha-config-automation .header .name` | MutationObserver |
| **Script** | `/config/script/edit/*` | `ha-config-script .header .name` | MutationObserver |
| **Scene** | `/config/scene/edit/*` | `ha-config-scene .header .name` | MutationObserver |
| **Blueprint** | `/config/blueprint/edit/*` | `ha-blueprint-editor .header .name` | MutationObserver |
| **Blueprint List** | `/config/blueprint/dashboard` | `.blueprint-card .name` | MutationObserver |
| **Voice Assistant** | `/config/voice-assistants/assistants` | `.pipeline-row .name` | MutationObserver |
| **Dashboard** | `/lovelace/*?edit=1` | Dashboard toolbar | URL param |

---

## 4. Backend Extensions

### 4.1 Updated `parseAllItems()` Function

```javascript
// backend/services/ha-parser.js

async parseAllItems(options = {}) {
  const {
    includeRaw = false,
    sequential = true,
    types = null
  } = options;

  const parsers = {
    automations: () => this.parseAutomations(includeRaw),
    scripts: () => this.parseScripts(includeRaw),
    scenes: () => this.parseScenes(includeRaw),
    blueprints: () => this.parseBlueprints(includeRaw),           // ⬅️ NEW
    voice_assistants: () => this.parseVoiceAssistants(includeRaw), // ⬅️ NEW
    conversation_intents: () => this.parseConversationIntents(includeRaw) // ⬅️ NEW
  };

  // Add optional parsers if enabled
  if (this.parseESPHome) {
    parsers.esphome = () => this.parseESPHome(includeRaw);
  }
  if (this.parsePackages) {
    parsers.packages = () => this.parsePackages(includeRaw);
  }
  if (this.backupLovelace) {
    parsers.lovelace = () => this.parseLovelaceDashboards(includeRaw);
  }

  // ... rest of function (unchanged)

  // Updated response structure
  const response = {
    automations: results.automations || [],
    scripts: results.scripts || [],
    scenes: results.scenes || [],
    blueprints: results.blueprints || [],              // ⬅️ NEW
    voice_assistants: results.voice_assistants || [],  // ⬅️ NEW
    conversation_intents: results.conversation_intents || [], // ⬅️ NEW
    esphome: results.esphome || [],
    packages: results.packages || [],
    lovelace: results.lovelace || [],
    total
  };

  return response;
}
```

### 4.2 Updated `getItem()` Function

```javascript
async getItem(type, id) {
  let items = [];

  switch (type) {
    case 'automation':
      items = await this.parseAutomations();
      break;
    case 'script':
      items = await this.parseScripts();
      break;
    case 'scene':
      items = await this.parseScenes();
      break;
    case 'blueprint':                              // ⬅️ NEW
      items = await this.parseBlueprints();
      break;
    case 'voice_assistant':                        // ⬅️ NEW
      items = await this.parseVoiceAssistants();
      break;
    case 'conversation_intent':                    // ⬅️ NEW
      items = await this.parseConversationIntents();
      break;
    case 'esphome':
      items = await this.parseESPHome();
      break;
    case 'package':
      items = await this.parsePackages();
      break;
    case 'lovelace_dashboard':
      items = await this.parseLovelaceDashboards();
      break;
    default:
      throw new Error(`Unknown item type: ${type}`);
  }

  return items.find(item => item.id === id);
}
```

---

## 5. Frontend Icon Injection

### 5.1 Updated Detection Logic

```typescript
// hacs-frontend/www/src/icon-injector.ts

class IconInjector {
  private checkCurrentPage() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Existing checks
    if (path.includes('/config/automation/edit/')) {
      this.injectAutomationIcon();
    } else if (path.includes('/config/script/edit/')) {
      this.injectScriptIcon();
    } else if (path.includes('/config/scene/edit/')) {
      this.injectSceneIcon();
    }

    // ⬅️ NEW: Blueprint checks
    else if (path.includes('/config/blueprint/edit/')) {
      this.injectBlueprintIcon();
    } else if (path.includes('/config/blueprint/dashboard')) {
      this.injectBlueprintListIcons();
    }

    // ⬅️ NEW: Voice Assistant checks
    else if (path.includes('/config/voice-assistants/assistants')) {
      this.injectVoiceAssistantIcons();
    } else if (path.includes('/config/voice-assistants/conversation')) {
      this.injectConversationIntentIcon();
    }

    // Existing dashboard check
    else if (path.includes('/lovelace/') && params.get('edit') === '1') {
      this.injectDashboardIcon();
    }
  }

  // ⬅️ NEW: Blueprint icon injection
  private async injectBlueprintIcon() {
    const nameElement = document.querySelector(
      'ha-blueprint-editor .header .name'
    );

    if (!nameElement || this.injectedIcons.has('current-blueprint')) {
      return;
    }

    const blueprintId = this.getBlueprintIdFromURL();
    if (!blueprintId) return;

    const versionCount = await this.getVersionCount('blueprint', blueprintId);
    const icon = this.createHistoryIcon(versionCount, 'blueprint', blueprintId);

    nameElement.parentElement?.appendChild(icon);
    this.injectedIcons.add('current-blueprint');
  }

  // ⬅️ NEW: Blueprint list icons
  private async injectBlueprintListIcons() {
    const blueprintCards = document.querySelectorAll('.blueprint-card');

    for (const card of blueprintCards) {
      const nameElement = card.querySelector('.name');
      if (!nameElement) continue;

      const blueprintId = card.getAttribute('data-blueprint-id');
      if (!blueprintId) continue;

      // Skip if already injected
      if (card.querySelector('.homeguardian-history-icon')) continue;

      const versionCount = await this.getVersionCount('blueprint', blueprintId);
      const icon = this.createHistoryIcon(versionCount, 'blueprint', blueprintId);

      nameElement.parentElement?.appendChild(icon);
    }
  }

  // ⬅️ NEW: Voice Assistant icons
  private async injectVoiceAssistantIcons() {
    const pipelineRows = document.querySelectorAll('.pipeline-row');

    for (const row of pipelineRows) {
      const nameElement = row.querySelector('.name');
      if (!nameElement) continue;

      const pipelineId = row.getAttribute('data-pipeline-id');
      if (!pipelineId) continue;

      // Skip if already injected
      if (row.querySelector('.homeguardian-history-icon')) continue;

      const versionCount = await this.getVersionCount('voice_assistant', pipelineId);
      const icon = this.createHistoryIcon(versionCount, 'voice_assistant', pipelineId);

      nameElement.parentElement?.appendChild(icon);
    }
  }

  // ⬅️ NEW: Conversation Intent icon
  private async injectConversationIntentIcon() {
    const intentSection = document.querySelector('.conversation-intents');
    if (!intentSection) return;

    const headerElement = intentSection.querySelector('.header');
    if (!headerElement || this.injectedIcons.has('conversation-intents')) {
      return;
    }

    const versionCount = await this.getVersionCount('conversation_intent', 'all');
    const icon = this.createHistoryIcon(versionCount, 'conversation_intent', 'all');

    headerElement.appendChild(icon);
    this.injectedIcons.add('conversation-intents');
  }

  // Helper: Extract blueprint ID from URL
  private getBlueprintIdFromURL(): string | null {
    const match = window.location.pathname.match(
      /\/config\/blueprint\/edit\/([^/]+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
  }
}
```

### 5.2 Updated DOM Selectors Reference

```typescript
// hacs-frontend/www/src/dom-selectors.ts

export const DOM_SELECTORS = {
  automation: {
    editor: 'ha-config-automation .header .name',
    list: 'ha-automation-row .name'
  },
  script: {
    editor: 'ha-config-script .header .name',
    list: 'ha-script-row .name'
  },
  scene: {
    editor: 'ha-config-scene .header .name',
    list: 'ha-scene-row .name'
  },
  blueprint: {                                     // ⬅️ NEW
    editor: 'ha-blueprint-editor .header .name',
    list: '.blueprint-card .name',
    import: '.blueprint-selector .blueprint-option'
  },
  voice_assistant: {                               // ⬅️ NEW
    list: '.pipeline-row .name',
    editor: '.pipeline-config .header'
  },
  conversation_intent: {                           // ⬅️ NEW
    section: '.conversation-intents .header'
  },
  dashboard: {
    toolbar: '.lovelace-header .toolbar'
  }
};
```

---

## 6. API Specifications

### 6.1 Updated API Endpoints

**All existing endpoints now support new types:**

```javascript
// Get history for blueprints
GET /api/history/item/blueprint/:id
Response: {
  item: {
    type: "blueprint",
    id: "automation_motion_light",
    name: "Motion-activated Light",
    domain: "automation",
    file: "blueprints/automation/motion_light.yaml"
  },
  commits: [...],
  totalCommits: 8
}

// Get history for voice assistants
GET /api/history/item/voice_assistant/:id
Response: {
  item: {
    type: "voice_assistant",
    id: "01HXX...",
    name: "Kitchen Assistant",
    file: ".storage/assist_pipeline"
  },
  commits: [...],
  totalCommits: 5
}

// Restore blueprint
POST /api/restore/item
Body: {
  type: "blueprint",
  id: "automation_motion_light",
  commitHash: "abc123"
}

// Restore voice assistant
POST /api/restore/item
Body: {
  type: "voice_assistant",
  id: "01HXX...",
  commitHash: "def456"
}
```

### 6.2 Type Validation

```javascript
// backend/routes/history-items.js

// Updated type whitelist
const VALID_TYPES = [
  'automation',
  'script',
  'scene',
  'blueprint',              // ⬅️ NEW
  'voice_assistant',        // ⬅️ NEW
  'conversation_intent',    // ⬅️ NEW
  'esphome',
  'package',
  'lovelace_dashboard'
];

router.get('/item/:type/:id', async (req, res) => {
  const { type, id } = req.params;

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({
      error: 'Invalid type',
      validTypes: VALID_TYPES
    });
  }

  // Continue with history retrieval...
});
```

---

## 7. UI/UX Specifications

### 7.1 Icon Variations

Different icon styles for different entity types:

```typescript
const ICON_STYLES = {
  automation: {
    icon: mdiHistory,
    color: 'var(--primary-color)',
    badge: 'primary'
  },
  script: {
    icon: mdiHistory,
    color: 'var(--accent-color)',
    badge: 'accent'
  },
  blueprint: {                   // ⬅️ NEW
    icon: mdiFileDocument,        // Different icon for blueprints
    color: 'var(--info-color)',
    badge: 'info'
  },
  voice_assistant: {             // ⬅️ NEW
    icon: mdiMicrophone,          // Microphone icon
    color: 'var(--success-color)',
    badge: 'success'
  },
  conversation_intent: {         // ⬅️ NEW
    icon: mdiChat,
    color: 'var(--warning-color)',
    badge: 'warning'
  }
};
```

### 7.2 Tooltip Variations

```typescript
const TOOLTIP_TEMPLATES = {
  automation: (count) => `View history (${count} versions)`,
  script: (count) => `View history (${count} versions)`,
  scene: (count) => `View history (${count} versions)`,
  blueprint: (count) => `View blueprint history (${count} changes)`,
  voice_assistant: (count) => `View pipeline history (${count} changes)`,
  conversation_intent: (count) => `View intent history (${count} changes)`,
  dashboard: (count) => `View dashboard history (${count} versions)`
};
```

### 7.3 History Popup Customization

```typescript
// Customize popup title based on entity type
const POPUP_TITLES = {
  automation: (name) => `Automation History: ${name}`,
  script: (name) => `Script History: ${name}`,
  scene: (name) => `Scene History: ${name}`,
  blueprint: (name) => `Blueprint History: ${name}`,
  voice_assistant: (name) => `Voice Assistant History: ${name}`,
  conversation_intent: (name) => `Conversation Intents History`,
  dashboard: (name) => `Dashboard History: ${name}`
};
```

---

## 8. Implementation Priority

### 8.1 Phased Rollout

**Phase 1 (Weeks 1-5): Original Scope - P0**
- ✅ Automations
- ✅ Scripts
- ✅ Scenes
- ✅ Dashboards

**Phase 2 (Week 6): NEW Entities - P0**
- ✅ **Blueprints** (Editor + List)
- ✅ **Voice Assistants** (Pipeline list)

**Phase 3 (Week 7): Extended NEW Entities - P1**
- ✅ **Conversation Intents**
- ⏹️ Blueprint import flow icons
- ⏹️ Voice assistant editor icons

**Phase 4 (Weeks 8+): Optional Entities - P2**
- ESPHome device list icons
- Package list icons

### 8.2 Development Effort Estimate

**Additional effort for Blueprints + Voice Assistants:**

| Task | Original Estimate | New Estimate | Delta |
|------|-------------------|--------------|-------|
| **Backend Parser** | 8h | **12h** | +4h |
| **Frontend Detection** | 12h | **18h** | +6h |
| **Icon Injection** | 16h | **24h** | +8h |
| **API Extensions** | 4h | **6h** | +2h |
| **Testing** | 12h | **18h** | +6h |
| **Documentation** | 4h | **6h** | +2h |
| **TOTAL** | 56h | **84h** | **+28h (~1 week)** |

**Updated Timeline:**
- Original: 5 weeks
- With Blueprints + Voice Assistants: **6 weeks**

### 8.3 Testing Matrix

**Additional test scenarios:**

```typescript
// Blueprint tests
describe('Blueprint Icon Injection', () => {
  it('should inject icon in blueprint editor');
  it('should inject icons in blueprint list');
  it('should show correct version count for blueprints');
  it('should handle automation vs script blueprints');
});

// Voice Assistant tests
describe('Voice Assistant Icon Injection', () => {
  it('should inject icon in pipeline list');
  it('should inject icon in conversation settings');
  it('should show correct version count for pipelines');
  it('should handle .storage file changes');
});
```

---

## 9. Backward Compatibility

### 9.1 Feature Flags

Add feature flags to enable/disable new entity types:

```javascript
// backend/.env
PARSE_BLUEPRINTS=true              # ⬅️ NEW (default: true)
PARSE_VOICE_ASSISTANTS=true        # ⬅️ NEW (default: true)
PARSE_CONVERSATION_INTENTS=false   # ⬅️ NEW (default: false, P1)
```

### 9.2 Graceful Degradation

If blueprint/voice assistant directories don't exist:
- No errors thrown
- Icons simply don't appear
- Logs warning (debug level)
- Returns empty array

```javascript
if (!exists) {
  logger.debug('Blueprints directory not found - skipping');
  return [];  // No error, just empty
}
```

---

## 10. Migration Guide

### 10.1 For Existing Users

**No action required!**

- New entity types detected automatically
- Existing git history preserved
- Icons appear immediately after upgrade
- No configuration changes needed

### 10.2 For Developers

**Update API calls to include new types:**

```typescript
// Before (v1.0)
const types = ['automation', 'script', 'scene'];

// After (v1.1)
const types = [
  'automation',
  'script',
  'scene',
  'blueprint',           // ⬅️ NEW
  'voice_assistant'      // ⬅️ NEW
];
```

---

## 11. Documentation Updates

### 11.1 User Documentation

**Add to README:**

```markdown
## Supported Entity Types

HomeGuardian tracks version history for:

- ✅ Automations
- ✅ Scripts
- ✅ Scenes
- ✅ **Blueprints** (automation + script) ⬅️ NEW
- ✅ **Voice Assistants** (Assist pipelines) ⬅️ NEW
- ✅ Dashboards (Lovelace)
- ⏹️ ESPHome devices (optional)
- ⏹️ Packages (optional)

History icons appear directly in the native HA editor for each type.
```

### 11.2 API Documentation

**Update API docs:**

```markdown
## GET /api/history/item/:type/:id

### Supported Types

- `automation` - Home Assistant automations
- `script` - Home Assistant scripts
- `scene` - Home Assistant scenes
- `blueprint` - Automation and script blueprints ⬅️ NEW
- `voice_assistant` - Assist voice pipelines ⬅️ NEW
- `conversation_intent` - Conversation intents ⬅️ NEW
- `lovelace_dashboard` - Lovelace dashboards
- `esphome` - ESPHome devices
- `package` - HA packages
```

---

## 12. Review & Approval

| Reviewer | Role | Status | Date | Comments |
|----------|------|--------|------|----------|
| Product Owner | Approval | ⏳ Pending | | |
| Tech Lead | Technical Review | ⏳ Pending | | |
| Frontend Dev | Implementation Review | ⏳ Pending | | |

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2025-11-08 | Claude | Added Blueprints & Voice Assistants support |
| 1.0 | 2025-11-08 | Claude | Original PDR (automations, scripts, scenes, dashboards) |

---

## Appendix A: File Path Reference

**Blueprint Files**:
```
/config/blueprints/
├── automation/
│   ├── homeassistant/
│   │   └── motion_light.yaml
│   └── my_blueprints/
│       └── custom_automation.yaml
└── script/
    └── good_night.yaml
```

**Voice Assistant Files**:
```
/config/.storage/assist_pipeline     ← Pipelines (JSON)
/config/configuration.yaml           ← Conversation intents (YAML)
```

---

## Appendix B: Complete Entity Type Summary

```typescript
interface EntityType {
  type: string;
  fileLocation: string;
  parseFunction: string;
  iconLocations: string[];
  priority: 'P0' | 'P1' | 'P2';
  version: '1.0' | '1.1';
}

const ENTITY_TYPES: EntityType[] = [
  // v1.0 entities
  { type: 'automation', fileLocation: 'automations.yaml', ... },
  { type: 'script', fileLocation: 'scripts.yaml', ... },
  { type: 'scene', fileLocation: 'scenes.yaml', ... },
  { type: 'lovelace_dashboard', fileLocation: '.storage/lovelace*', ... },

  // v1.1 entities (NEW)
  { type: 'blueprint', fileLocation: 'blueprints/*/', priority: 'P0', version: '1.1' },
  { type: 'voice_assistant', fileLocation: '.storage/assist_pipeline', priority: 'P0', version: '1.1' },
  { type: 'conversation_intent', fileLocation: 'configuration.yaml', priority: 'P1', version: '1.1' },

  // Optional entities
  { type: 'esphome', fileLocation: 'esphome/*.yaml', priority: 'P2', version: '1.0' },
  { type: 'package', fileLocation: 'packages/*.yaml', priority: 'P2', version: '1.0' }
];
```

---

**Status**: ✅ Addendum Complete - Ready for Review

**Extends**: PDR_HACS_Icon_Injection.md v1.0

**Impact**: Adds +28 hours development effort (+1 week)

**Priority**: P0 (Blueprints, Voice Assistants) + P1 (Conversation Intents)

---

**End of Addendum**
