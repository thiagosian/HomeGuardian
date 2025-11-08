/**
 * HomeGuardian UI - Main Entry Point
 * Icon-based version control integration for Home Assistant
 */

import { IconInjector } from './icon-injector';
import { getApiClient } from './api-client';
import './history-popup';

console.log(
  '%c HomeGuardian UI %c v1.0.0 ',
  'background: #4CAF50; color: white; font-weight: bold;',
  'background: #333; color: white;'
);

/**
 * Initialize the HomeGuardian UI integration
 */
async function initialize(): Promise<void> {
  console.log('[HomeGuardian UI] Initializing...');

  // Check if add-on is available
  const apiClient = getApiClient();
  const isAvailable = await apiClient.ping();

  if (!isAvailable) {
    console.warn(
      '[HomeGuardian UI] HomeGuardian add-on is not responding. ' +
      'Icon injection will be disabled until the add-on is started.'
    );
    // Still initialize, but show a warning
  }

  // Create and start icon injector
  const injector = new IconInjector();

  // Wait for Home Assistant to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startInjector(injector);
    });
  } else {
    startInjector(injector);
  }

  // Expose to window for debugging
  (window as any).homeGuardianUI = {
    injector,
    apiClient,
    version: '1.0.0',
    enableDebug: () => {
      localStorage.setItem('homeguardian_debug', 'true');
      console.log('[HomeGuardian UI] Debug logging enabled');
    },
    disableDebug: () => {
      localStorage.removeItem('homeguardian_debug');
      console.log('[HomeGuardian UI] Debug logging disabled');
    },
  };
}

/**
 * Start the icon injector with retry logic
 */
function startInjector(injector: IconInjector): void {
  // Wait for Home Assistant panel to be ready
  const checkReady = setInterval(() => {
    const panel = document.querySelector('home-assistant, ha-panel-lovelace');
    if (panel) {
      clearInterval(checkReady);
      console.log('[HomeGuardian UI] Home Assistant ready, starting icon injection');
      injector.start();
    }
  }, 500);

  // Timeout after 30 seconds
  setTimeout(() => {
    clearInterval(checkReady);
    console.warn('[HomeGuardian UI] Timeout waiting for Home Assistant to be ready');
    // Start anyway
    injector.start();
  }, 30000);
}

// Auto-initialize when script loads
initialize().catch((error) => {
  console.error('[HomeGuardian UI] Initialization failed:', error);
});

// Export for testing
export { IconInjector, getApiClient };
