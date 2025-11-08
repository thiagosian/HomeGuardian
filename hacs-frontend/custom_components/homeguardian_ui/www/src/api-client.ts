/**
 * API Client for communicating with HomeGuardian Add-on
 */

import type {
  ApiResponse,
  Entity,
  EntityType,
  VersionInfo,
  RollbackRequest,
  RollbackResponse,
  Commit,
} from './types';

export class HomeGuardianApiClient {
  private baseUrl: string;
  private ingressUrl: string;

  constructor() {
    // Auto-detect ingress URL from current location
    this.ingressUrl = this.detectIngressUrl();
    this.baseUrl = `${this.ingressUrl}/api`;
    this.log('Initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Detect the HomeGuardian add-on ingress URL
   */
  private detectIngressUrl(): string {
    // Check if we're in an ingress context
    const ingressPattern = /\/api\/hassio_ingress\/([^/]+)/;
    const match = window.location.pathname.match(ingressPattern);

    if (match) {
      const slug = match[1];
      return `/api/hassio_ingress/${slug}`;
    }

    // Fallback: Try to find HomeGuardian add-on from hass object
    if ((window as any).homeGuardianAddonSlug) {
      const slug = (window as any).homeGuardianAddonSlug;
      return `/api/hassio_ingress/${slug}`;
    }

    // Default fallback
    return '/api/hassio_ingress/a0d7b954_homeguardian';
  }

  /**
   * Make an API request to the HomeGuardian add-on
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      this.log('Request:', url, options);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.log('Response:', data);

      return {
        success: true,
        data,
      };
    } catch (error) {
      this.error('Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all items of a specific type
   */
  async getItems(type?: EntityType): Promise<ApiResponse<Entity[]>> {
    const endpoint = type ? `/items?type=${type}` : '/items';
    return this.request<Entity[]>(endpoint);
  }

  /**
   * Get a specific item by type and ID
   */
  async getItem(type: EntityType, id: string): Promise<ApiResponse<Entity>> {
    return this.request<Entity>(`/items/${type}/${id}`);
  }

  /**
   * Get version history for a specific entity
   */
  async getHistory(
    type: EntityType,
    id: string,
    limit: number = 5
  ): Promise<ApiResponse<VersionInfo>> {
    return this.request<VersionInfo>(
      `/history/${type}/${id}?limit=${limit}`
    );
  }

  /**
   * Get commit history affecting a specific file
   */
  async getFileHistory(
    filePath: string,
    limit: number = 5
  ): Promise<ApiResponse<Commit[]>> {
    const encodedPath = encodeURIComponent(filePath);
    return this.request<Commit[]>(
      `/git/history?file=${encodedPath}&limit=${limit}`
    );
  }

  /**
   * Get diff for a specific commit
   */
  async getCommitDiff(commitHash: string): Promise<ApiResponse<string>> {
    return this.request<string>(`/git/diff/${commitHash}`);
  }

  /**
   * Rollback an entity to a specific commit
   */
  async rollback(
    request: RollbackRequest
  ): Promise<ApiResponse<RollbackResponse>> {
    return this.request<RollbackResponse>('/rollback', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get Git status
   */
  async getGitStatus(): Promise<ApiResponse<any>> {
    return this.request<any>('/git/status');
  }

  /**
   * Check if HomeGuardian add-on is available
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Logging helper
   */
  private log(...args: any[]): void {
    if (this.isDebugEnabled()) {
      console.log('[HomeGuardian API]', ...args);
    }
  }

  /**
   * Error logging helper
   */
  private error(...args: any[]): void {
    console.error('[HomeGuardian API]', ...args);
  }

  /**
   * Check if debug logging is enabled
   */
  private isDebugEnabled(): boolean {
    return localStorage.getItem('homeguardian_debug') === 'true';
  }
}

// Singleton instance
let apiClientInstance: HomeGuardianApiClient | null = null;

export function getApiClient(): HomeGuardianApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new HomeGuardianApiClient();
  }
  return apiClientInstance;
}
