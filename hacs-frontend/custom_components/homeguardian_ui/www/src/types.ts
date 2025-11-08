/**
 * Type definitions for HomeGuardian UI Integration
 */

export type EntityType =
  | 'automation'
  | 'script'
  | 'scene'
  | 'blueprint'
  | 'voice_assistant'
  | 'conversation_intent'
  | 'dashboard'
  | 'esphome'
  | 'package';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description?: string;
  file: string;
  enabled?: boolean;
  raw?: any;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

export interface HistoryItem {
  commit: Commit;
  affectsEntity: boolean;
  diffPreview?: string;
}

export interface VersionInfo {
  entityId: string;
  entityType: EntityType;
  versionCount: number;
  history: HistoryItem[];
}

export interface RollbackRequest {
  entityType: EntityType;
  entityId: string;
  commitHash: string;
  createBackup: boolean;
}

export interface RollbackResponse {
  success: boolean;
  message: string;
  backupCommit?: string;
  restoredCommit: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HomeGuardianConfig {
  addonSlug: string;
  apiBaseUrl: string;
  ingressUrl: string;
  enableDebugLogging: boolean;
}

export interface InjectionPoint {
  selector: string;
  insertPosition: 'beforeend' | 'afterbegin' | 'before' | 'after';
  entityType: EntityType;
  extractEntityId: (element: Element) => string | null;
}

export interface IconState {
  entityType: EntityType;
  entityId: string;
  versionCount: number;
  isLoading: boolean;
  hasError: boolean;
  iconElement?: HTMLElement;
}
