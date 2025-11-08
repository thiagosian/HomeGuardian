/**
 * Icon Injector
 * Monitors the DOM and injects history icons into HA UI elements
 */

import type { EntityType, IconState } from './types';
import { getApiClient } from './api-client';

export class IconInjector {
  private observer: MutationObserver;
  private apiClient = getApiClient();
  private injectedIcons: Map<string, IconState> = new Map();
  private isRunning = false;

  constructor() {
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });
  }

  /**
   * Start observing the DOM for injection points
   */
  start(): void {
    if (this.isRunning) {
      this.log('Already running');
      return;
    }

    this.log('Starting icon injection');
    this.isRunning = true;

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Check current page immediately
    this.checkCurrentPage();

    // Also check on hash/state changes
    window.addEventListener('hashchange', () => this.checkCurrentPage());
    window.addEventListener('popstate', () => this.checkCurrentPage());
  }

  /**
   * Stop observing
   */
  stop(): void {
    this.log('Stopping icon injection');
    this.isRunning = false;
    this.observer.disconnect();
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkElement(node as Element);
          }
        });
      }
    }
  }

  /**
   * Check current page and inject icons if needed
   */
  private async checkCurrentPage(): Promise<void> {
    this.log('Checking current page:', window.location.pathname);

    // Wait for page stability with exponential backoff
    await this.waitForPageStability();

    // Define all injection tasks with error boundaries
    const injectionTasks = [
      { name: 'automation', fn: () => this.injectAutomationIcon() },
      { name: 'script', fn: () => this.injectScriptIcon() },
      { name: 'scene', fn: () => this.injectSceneIcon() },
      { name: 'blueprint', fn: () => this.injectBlueprintIcon() },
      { name: 'blueprint-list', fn: () => this.injectBlueprintListIcons() },
      { name: 'voice-assistant', fn: () => this.injectVoiceAssistantIcons() },
      { name: 'dashboard', fn: () => this.injectDashboardIcons() },
    ];

    // Execute all injections with error boundaries
    for (const task of injectionTasks) {
      try {
        await task.fn();
      } catch (error) {
        // Log error but don't let one failure stop others
        this.error(`Failed to inject ${task.name} icon:`, error);
        // Continue to next injection
      }
    }
  }

  /**
   * Wait for page to be stable using exponential backoff
   * @param maxAttempts Maximum number of retry attempts
   * @param baseDelay Base delay in milliseconds
   */
  private async waitForPageStability(
    maxAttempts = 10,
    baseDelay = 100
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const delay = baseDelay * Math.pow(1.5, i); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));

      // Check if key Home Assistant elements are present
      const isReady = document.querySelector('home-assistant, ha-panel-lovelace, partial-panel-resolver');
      if (isReady) {
        this.log('Page ready after', delay, 'ms');
        return;
      }
    }

    this.error('Page stability timeout - proceeding anyway');
  }

  /**
   * Check a specific element for injection points
   */
  private checkElement(element: Element): void {
    // Check for automation editor
    if (element.matches('ha-config-automation')) {
      this.injectAutomationIcon();
    }

    // Check for script editor
    if (element.matches('ha-config-script')) {
      this.injectScriptIcon();
    }

    // Check for scene editor
    if (element.matches('ha-config-scene')) {
      this.injectSceneIcon();
    }

    // Check for blueprint editor
    if (element.matches('ha-blueprint-editor')) {
      this.injectBlueprintIcon();
    }

    // Check for dashboard editor
    if (element.matches('hui-view, hui-panel-view')) {
      this.injectDashboardIcons();
    }
  }

  /**
   * Inject icon for automation editor
   */
  private async injectAutomationIcon(): Promise<void> {
    // Try multiple selectors for robustness
    const selectors = [
      'ha-config-automation .header .name',
      'ha-config-automation mwc-button[slot="toolbar-icon"]',
      'ha-config-automation .toolbar .title',
    ];

    for (const selector of selectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement) {
        const automationId = this.getAutomationIdFromURL();
        if (automationId) {
          await this.injectIcon(
            nameElement,
            'automation',
            automationId,
            'automation-icon'
          );
          break;
        }
      }
    }
  }

  /**
   * Inject icon for script editor
   */
  private async injectScriptIcon(): Promise<void> {
    const selectors = [
      'ha-config-script .header .name',
      'ha-config-script mwc-button[slot="toolbar-icon"]',
      'ha-config-script .toolbar .title',
    ];

    for (const selector of selectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement) {
        const scriptId = this.getScriptIdFromURL();
        if (scriptId) {
          await this.injectIcon(
            nameElement,
            'script',
            scriptId,
            'script-icon'
          );
          break;
        }
      }
    }
  }

  /**
   * Inject icon for scene editor
   */
  private async injectSceneIcon(): Promise<void> {
    const selectors = [
      'ha-config-scene .header .name',
      'ha-config-scene mwc-button[slot="toolbar-icon"]',
      'ha-config-scene .toolbar .title',
    ];

    for (const selector of selectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement) {
        const sceneId = this.getSceneIdFromURL();
        if (sceneId) {
          await this.injectIcon(nameElement, 'scene', sceneId, 'scene-icon');
          break;
        }
      }
    }
  }

  /**
   * Inject icon for blueprint editor
   */
  private async injectBlueprintIcon(): Promise<void> {
    const selectors = [
      'ha-blueprint-editor .header .name',
      'ha-blueprint-editor mwc-button[slot="toolbar-icon"]',
    ];

    for (const selector of selectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement) {
        const blueprintId = this.getBlueprintIdFromURL();
        if (blueprintId) {
          await this.injectIcon(
            nameElement,
            'blueprint',
            blueprintId,
            'blueprint-icon'
          );
          break;
        }
      }
    }
  }

  /**
   * Inject icons for blueprint list view
   */
  private async injectBlueprintListIcons(): Promise<void> {
    const blueprintRows = document.querySelectorAll(
      '.blueprint-row, [data-blueprint-id]'
    );

    for (const row of blueprintRows) {
      const nameElement = row.querySelector('.name, .title');
      const blueprintId = row.getAttribute('data-blueprint-id');

      if (nameElement && blueprintId) {
        await this.injectIcon(
          nameElement,
          'blueprint',
          blueprintId,
          `blueprint-list-icon-${blueprintId}`
        );
      }
    }
  }

  /**
   * Inject icons for voice assistant pipelines
   */
  private async injectVoiceAssistantIcons(): Promise<void> {
    const pipelineRows = document.querySelectorAll(
      '.pipeline-row, [data-pipeline-id]'
    );

    for (const row of pipelineRows) {
      const nameElement = row.querySelector('.name, .title');
      const pipelineId = row.getAttribute('data-pipeline-id');

      if (nameElement && pipelineId) {
        await this.injectIcon(
          nameElement,
          'voice_assistant',
          pipelineId,
          `voice-assistant-icon-${pipelineId}`
        );
      }
    }
  }

  /**
   * Inject icons for dashboard configuration
   */
  private async injectDashboardIcons(): Promise<void> {
    // Dashboard edit mode button
    const dashboardButtons = document.querySelectorAll(
      'hui-view mwc-icon-button[title*="Edit"], hui-panel-view mwc-icon-button[title*="Edit"]'
    );

    for (const button of dashboardButtons) {
      const dashboardId = this.getDashboardIdFromURL();
      if (dashboardId) {
        await this.injectIcon(
          button,
          'dashboard',
          dashboardId,
          'dashboard-icon'
        );
      }
    }
  }

  /**
   * Core injection logic
   */
  private async injectIcon(
    targetElement: Element,
    entityType: EntityType,
    entityId: string,
    iconKey: string
  ): Promise<void> {
    // Check if already injected
    if (this.injectedIcons.has(iconKey)) {
      return;
    }

    // Get version count
    const versionCount = await this.getVersionCount(entityType, entityId);

    // Create icon element
    const icon = this.createHistoryIcon(
      versionCount,
      entityType,
      entityId,
      iconKey
    );

    // Insert icon
    const parent = targetElement.parentElement;
    if (parent) {
      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.style.gap = '8px';
      parent.appendChild(icon);

      // Track injection
      this.injectedIcons.set(iconKey, {
        entityType,
        entityId,
        versionCount,
        isLoading: false,
        hasError: false,
        iconElement: icon,
      });

      this.log(`Injected icon for ${entityType}:${entityId}`);
    }
  }

  /**
   * Get version count for an entity
   */
  private async getVersionCount(
    entityType: EntityType,
    entityId: string
  ): Promise<number> {
    try {
      const response = await this.apiClient.getHistory(entityType, entityId, 1);
      if (response.success && response.data) {
        return response.data.versionCount;
      }
    } catch (error) {
      this.error('Failed to get version count:', error);
    }
    return 0;
  }

  /**
   * Create history icon element
   */
  private createHistoryIcon(
    versionCount: number,
    entityType: EntityType,
    entityId: string,
    iconKey: string
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'homeguardian-icon-container';
    container.setAttribute('data-icon-key', iconKey);
    container.style.cssText = `
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
    `;

    // Icon
    const haIcon = document.createElement('ha-icon');
    haIcon.setAttribute('icon', 'mdi:history');
    haIcon.style.cssText = '--mdc-icon-size: 16px;';

    // Count badge
    const badge = document.createElement('span');
    badge.textContent = versionCount > 0 ? versionCount.toString() : '0';
    badge.style.cssText = `
      font-weight: 500;
      font-size: 11px;
    `;

    container.appendChild(haIcon);
    container.appendChild(badge);

    // Add hover effect
    container.addEventListener('mouseenter', () => {
      container.style.opacity = '0.9';
      container.style.transform = 'scale(1.05)';
    });

    container.addEventListener('mouseleave', () => {
      container.style.opacity = '1';
      container.style.transform = 'scale(1)';
    });

    // Add click handler
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showHistoryPopup(entityType, entityId);
    });

    return container;
  }

  /**
   * Show history popup
   */
  private showHistoryPopup(entityType: EntityType, entityId: string): void {
    this.log(`Opening history popup for ${entityType}:${entityId}`);

    // Create dialog
    const dialog = document.createElement('ha-dialog');
    dialog.setAttribute('open', '');
    dialog.style.cssText = '--mdc-dialog-max-width: 800px;';

    // Create popup component
    const popup = document.createElement('homeguardian-history-popup');
    popup.setAttribute('entity-type', entityType);
    popup.setAttribute('entity-id', entityId);
    popup.setAttribute('entity-name', entityId);

    // Handle close
    popup.addEventListener('close', () => {
      dialog.close();
      dialog.remove();
    });

    dialog.appendChild(popup);
    document.body.appendChild(dialog);
  }

  /**
   * Extract entity IDs from URL
   */
  private getAutomationIdFromURL(): string | null {
    const match = window.location.pathname.match(
      /\/config\/automation\/edit\/(.+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  private getScriptIdFromURL(): string | null {
    const match = window.location.pathname.match(/\/config\/script\/edit\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private getSceneIdFromURL(): string | null {
    const match = window.location.pathname.match(/\/config\/scene\/edit\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private getBlueprintIdFromURL(): string | null {
    const match = window.location.pathname.match(
      /\/config\/blueprint\/edit\/(.+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  private getDashboardIdFromURL(): string | null {
    const match = window.location.pathname.match(/\/lovelace\/(.+)/);
    return match ? match[1] : 'default';
  }

  /**
   * Logging helper
   */
  private log(...args: any[]): void {
    if (this.isDebugEnabled()) {
      console.log('[HomeGuardian IconInjector]', ...args);
    }
  }

  /**
   * Error logging helper
   */
  private error(...args: any[]): void {
    console.error('[HomeGuardian IconInjector]', ...args);
  }

  /**
   * Check if debug logging is enabled
   */
  private isDebugEnabled(): boolean {
    return localStorage.getItem('homeguardian_debug') === 'true';
  }
}
