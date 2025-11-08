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
      { name: 'automation-list', fn: () => this.injectAutomationListIcons() },
      { name: 'automation-info', fn: () => this.injectAutomationInfoIcon() },
      { name: 'script-list', fn: () => this.injectScriptListIcons() },
      { name: 'script-info', fn: () => this.injectScriptInfoIcon() },
      { name: 'scene-list', fn: () => this.injectSceneListIcons() },
      { name: 'dashboard-list', fn: () => this.injectDashboardListIcons() },
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
    // Check for automation list
    if (element.matches('ha-automation-picker, ha-data-table')) {
      this.injectAutomationListIcons();
    }

    // Check for script list
    if (element.matches('ha-script-picker')) {
      this.injectScriptListIcons();
    }

    // Check for scene list
    if (element.matches('ha-scene-picker')) {
      this.injectSceneListIcons();
    }

    // Check for config info panels
    if (element.matches('ha-config-automation-info, ha-config-script-info')) {
      this.injectAutomationInfoIcon();
    }
  }

  /**
   * Inject icons in automation list page
   */
  private async injectAutomationListIcons(): Promise<void> {
    this.log('Injecting automation list icons');

    // Look for automation rows in the data table
    const rows = document.querySelectorAll(
      'ha-data-table tr[data-automation-id], ' +
      'ha-data-table .mdc-data-table__row, ' +
      '.automation-row'
    );

    if (rows.length === 0) {
      this.log('No automation rows found');
      return;
    }

    for (const row of rows) {
      // Try to get automation ID from various sources
      const automationId =
        row.getAttribute('data-automation-id') ||
        row.querySelector('[data-entity-id]')?.getAttribute('data-entity-id') ||
        row.querySelector('.name, .title')?.textContent?.trim();

      if (!automationId) continue;

      // Find the name cell or title
      const nameCell = row.querySelector('.name, .title, mwc-list-item');
      if (nameCell && !nameCell.querySelector('.homeguardian-icon-container')) {
        await this.injectIcon(
          nameCell,
          'automation',
          automationId,
          `automation-list-${automationId}`
        );
      }
    }
  }

  /**
   * Inject icon in automation info/view page (not edit)
   */
  private async injectAutomationInfoIcon(): Promise<void> {
    this.log('Injecting automation info icon');

    const automationId = this.getAutomationIdFromURL();
    if (!automationId) return;

    // Look for the automation name in the info page
    const selectors = [
      'ha-config-automation-info .header',
      '.automation-header .title',
      'h1, h2, .name',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && !element.querySelector('.homeguardian-icon-container')) {
        await this.injectIcon(
          element,
          'automation',
          automationId,
          'automation-info'
        );
        break;
      }
    }
  }

  /**
   * Inject icons in script list page
   */
  private async injectScriptListIcons(): Promise<void> {
    this.log('Injecting script list icons');

    const rows = document.querySelectorAll(
      'ha-data-table tr[data-script-id], ' +
      'ha-data-table .mdc-data-table__row, ' +
      '.script-row'
    );

    for (const row of rows) {
      const scriptId =
        row.getAttribute('data-script-id') ||
        row.querySelector('[data-entity-id]')?.getAttribute('data-entity-id') ||
        row.querySelector('.name, .title')?.textContent?.trim();

      if (!scriptId) continue;

      const nameCell = row.querySelector('.name, .title, mwc-list-item');
      if (nameCell && !nameCell.querySelector('.homeguardian-icon-container')) {
        await this.injectIcon(
          nameCell,
          'script',
          scriptId,
          `script-list-${scriptId}`
        );
      }
    }
  }

  /**
   * Inject icon in script info/view page
   */
  private async injectScriptInfoIcon(): Promise<void> {
    this.log('Injecting script info icon');

    const scriptId = this.getScriptIdFromURL();
    if (!scriptId) return;

    const selectors = [
      'ha-config-script-info .header',
      '.script-header .title',
      'h1, h2, .name',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && !element.querySelector('.homeguardian-icon-container')) {
        await this.injectIcon(
          element,
          'script',
          scriptId,
          'script-info'
        );
        break;
      }
    }
  }

  /**
   * Inject icons in scene list page
   */
  private async injectSceneListIcons(): Promise<void> {
    this.log('Injecting scene list icons');

    const rows = document.querySelectorAll(
      'ha-data-table tr[data-scene-id], ' +
      'ha-data-table .mdc-data-table__row, ' +
      '.scene-row'
    );

    for (const row of rows) {
      const sceneId =
        row.getAttribute('data-scene-id') ||
        row.querySelector('[data-entity-id]')?.getAttribute('data-entity-id') ||
        row.querySelector('.name, .title')?.textContent?.trim();

      if (!sceneId) continue;

      const nameCell = row.querySelector('.name, .title, mwc-list-item');
      if (nameCell && !nameCell.querySelector('.homeguardian-icon-container')) {
        await this.injectIcon(
          nameCell,
          'scene',
          sceneId,
          `scene-list-${sceneId}`
        );
      }
    }
  }

  /**
   * Inject icons in dashboard list
   */
  private async injectDashboardListIcons(): Promise<void> {
    this.log('Injecting dashboard list icons');

    const dashboardCards = document.querySelectorAll(
      '.dashboard-card, [data-dashboard-id]'
    );

    for (const card of dashboardCards) {
      const dashboardId =
        card.getAttribute('data-dashboard-id') ||
        card.querySelector('.name, .title')?.textContent?.trim();

      if (!dashboardId) continue;

      const nameElement = card.querySelector('.name, .title');
      if (nameElement && !nameElement.querySelector('.homeguardian-icon-container')) {
        await this.injectIcon(
          nameElement,
          'dashboard',
          dashboardId,
          `dashboard-list-${dashboardId}`
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
    // Match both /edit/ and /show/ or /info/ pages
    const match = window.location.pathname.match(
      /\/config\/automation\/(?:edit|show|info)\/(.+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  private getScriptIdFromURL(): string | null {
    const match = window.location.pathname.match(
      /\/config\/script\/(?:edit|show|info)\/(.+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  private getSceneIdFromURL(): string | null {
    const match = window.location.pathname.match(
      /\/config\/scene\/(?:edit|show|info)\/(.+)/
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
