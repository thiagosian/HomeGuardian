/**
 * Selectors and Patterns Configuration
 * Centralized configuration for all DOM selectors and URL patterns
 */

/**
 * DOM selectors for icon injection points
 * Each entity type has multiple fallback selectors for robustness
 */
export const INJECTION_SELECTORS = {
  automation: [
    'ha-config-automation .header .name',
    'ha-config-automation mwc-button[slot="toolbar-icon"]',
    'ha-config-automation .toolbar .title',
    'ha-automation-editor .header .name',
  ],
  script: [
    'ha-config-script .header .name',
    'ha-config-script mwc-button[slot="toolbar-icon"]',
    'ha-config-script .toolbar .title',
    'ha-script-editor .header .name',
  ],
  scene: [
    'ha-config-scene .header .name',
    'ha-config-scene mwc-button[slot="toolbar-icon"]',
    'ha-config-scene .toolbar .title',
    'ha-scene-editor .header .name',
  ],
  blueprint: [
    'ha-blueprint-editor .header .name',
    'ha-blueprint-editor mwc-button[slot="toolbar-icon"]',
    'ha-automation-blueprint-editor .header .name',
    'ha-script-blueprint-editor .header .name',
  ],
  blueprintList: [
    '.blueprint-row',
    '[data-blueprint-id]',
    'ha-blueprint-picker mwc-list-item',
  ],
  voiceAssistant: [
    '.pipeline-row',
    '[data-pipeline-id]',
    'ha-assist-pipeline-row',
    '.assist-pipeline-card',
  ],
  dashboard: [
    'hui-view mwc-icon-button[title*="Edit"]',
    'hui-panel-view mwc-icon-button[title*="Edit"]',
    'ha-app-layout hui-root [title*="Edit"]',
  ],
} as const;

/**
 * URL patterns for extracting entity IDs
 * Used to identify which entity is being edited
 */
export const ENTITY_ID_PATTERNS = {
  automation: /\/config\/automation\/edit\/(.+)/,
  script: /\/config\/script\/edit\/(.+)/,
  scene: /\/config\/scene\/edit\/(.+)/,
  blueprint: /\/config\/blueprint\/edit\/(.+)/,
  dashboard: /\/lovelace\/(.+)/,
} as const;

/**
 * Element matchers for MutationObserver
 * Patterns to detect when relevant elements are added to DOM
 */
export const ELEMENT_MATCHERS = {
  automation: 'ha-config-automation',
  script: 'ha-config-script',
  scene: 'ha-config-scene',
  blueprint: 'ha-blueprint-editor',
  dashboard: 'hui-view, hui-panel-view',
} as const;

/**
 * Retry configuration for page stability checks
 */
export const RETRY_CONFIG = {
  maxAttempts: 10,
  baseDelay: 100, // milliseconds
  backoffMultiplier: 1.5,
  timeout: 30000, // 30 seconds total timeout
} as const;

/**
 * Icon styling configuration
 */
export const ICON_STYLES = {
  container: `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--primary-color);
    color: var(--text-primary-color);
    font-size: 12px;
    transition: all 0.2s;
  `,
  containerHover: `
    opacity: 0.9;
    transform: scale(1.05);
  `,
  haIcon: `--mdc-icon-size: 16px;`,
  badge: `
    font-weight: 500;
    font-size: 11px;
  `,
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  defaultHistoryLimit: 10,
  maxBatchSize: 50,
  cacheTimeout: 300000, // 5 minutes in milliseconds
  requestTimeout: 10000, // 10 seconds
} as const;

/**
 * Debug configuration
 */
export const DEBUG_CONFIG = {
  storageKey: 'homeguardian_debug',
  logPrefix: '[HomeGuardian UI]',
} as const;
