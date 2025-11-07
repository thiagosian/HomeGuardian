/**
 * Ingress path detection for Home Assistant ingress compatibility
 *
 * When running through Home Assistant ingress, the app is served at:
 * https://homeassistant.domain.com/api/hassio_ingress/<TOKEN>/
 *
 * We need to detect this base path and use it for:
 * 1. React Router basename
 * 2. Axios baseURL
 */

/**
 * Detects the ingress base path from the current window location
 * @returns {string} The base path (e.g., "/api/hassio_ingress/TOKEN" or "")
 */
export function getIngressBasePath() {
  const pathname = window.location.pathname;

  // Check if we're running through Home Assistant ingress
  const ingressMatch = pathname.match(/^(\/api\/hassio_ingress\/[^\/]+)/);

  if (ingressMatch) {
    return ingressMatch[1];
  }

  // Not running through ingress
  return '';
}

/**
 * Gets the API base URL considering ingress path
 * @returns {string} The API base URL
 */
export function getApiBaseUrl() {
  const basePath = getIngressBasePath();

  // If running through ingress, API is at <INGRESS_PATH>/api
  // If not, API is at /api (relative to current location)
  return basePath ? `${basePath}/api` : './api';
}

/**
 * Gets the basename for React Router
 * @returns {string} The basename for BrowserRouter
 */
export function getRouterBasename() {
  return getIngressBasePath() || '/';
}
