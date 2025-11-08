/**
 * History Popup Component
 * Displays version history for an entity with rollback capabilities
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { EntityType, VersionInfo, HistoryItem } from './types';
import { getApiClient } from './api-client';

@customElement('homeguardian-history-popup')
export class HistoryPopup extends LitElement {
  @property({ type: String }) entityType!: EntityType;
  @property({ type: String }) entityId!: string;
  @property({ type: String }) entityName!: string;

  @state() private history: HistoryItem[] = [];
  @state() private isLoading = true;
  @state() private error: string | null = null;
  @state() private selectedCommit: string | null = null;
  @state() private diffContent: string | null = null;
  @state() private isRollingBack = false;

  private apiClient = getApiClient();

  static styles = css`
    :host {
      display: block;
      font-family: var(--primary-font-family);
    }

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--divider-color);
    }

    .popup-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 500;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: var(--primary-text-color);
      opacity: 0.6;
    }

    .close-button:hover {
      opacity: 1;
    }

    .popup-content {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
    }

    .loading,
    .error {
      text-align: center;
      padding: 32px;
      color: var(--secondary-text-color);
    }

    .error {
      color: var(--error-color);
    }

    .history-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .history-item {
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .history-item:hover {
      background: var(--secondary-background-color);
      border-color: var(--primary-color);
    }

    .history-item.selected {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: var(--text-primary-color);
    }

    .commit-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .commit-hash {
      font-family: monospace;
      font-size: 12px;
      opacity: 0.7;
    }

    .commit-date {
      font-size: 12px;
      opacity: 0.7;
    }

    .commit-message {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .commit-author {
      font-size: 12px;
      opacity: 0.7;
    }

    .diff-viewer {
      margin-top: 16px;
      padding: 12px;
      background: var(--code-editor-background-color, #1e1e1e);
      border-radius: 4px;
      overflow-x: auto;
    }

    .diff-content {
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      color: #d4d4d4;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-secondary {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--secondary-text-color);
    }

    ha-icon {
      --mdc-icon-size: 20px;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    const response = await this.apiClient.getHistory(
      this.entityType,
      this.entityId,
      10
    );

    if (response.success && response.data) {
      this.history = response.data.history;
    } else {
      this.error = response.error || 'Failed to load history';
    }

    this.isLoading = false;
  }

  private async selectCommit(commitHash: string): Promise<void> {
    this.selectedCommit = commitHash;
    this.diffContent = null;

    const response = await this.apiClient.getCommitDiff(commitHash);
    if (response.success && response.data) {
      this.diffContent = response.data;
    }
  }

  private async handleRollback(): Promise<void> {
    if (!this.selectedCommit) return;

    const confirmed = confirm(
      `Are you sure you want to restore "${this.entityName}" to this version?\n\n` +
      `A safety backup will be created automatically.`
    );

    if (!confirmed) return;

    this.isRollingBack = true;

    const response = await this.apiClient.rollback({
      entityType: this.entityType,
      entityId: this.entityId,
      commitHash: this.selectedCommit,
      createBackup: true,
    });

    this.isRollingBack = false;

    if (response.success && response.data) {
      alert(`✅ Successfully restored to version ${this.selectedCommit.substring(0, 7)}`);
      this.close();
      // Trigger page reload to show updated entity
      window.location.reload();
    } else {
      alert(`❌ Rollback failed: ${response.error}`);
    }
  }

  private close(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private renderHistoryItem(item: HistoryItem): TemplateResult {
    const isSelected = this.selectedCommit === item.commit.hash;

    return html`
      <li
        class="history-item ${isSelected ? 'selected' : ''}"
        @click=${() => this.selectCommit(item.commit.hash)}
      >
        <div class="commit-header">
          <span class="commit-hash">${item.commit.hash.substring(0, 7)}</span>
          <span class="commit-date">${this.formatDate(item.commit.date)}</span>
        </div>
        <div class="commit-message">${item.commit.message}</div>
        <div class="commit-author">by ${item.commit.author}</div>
      </li>
    `;
  }

  render(): TemplateResult {
    return html`
      <div class="popup-header">
        <div class="popup-title">
          <ha-icon icon="mdi:history"></ha-icon>
          <span>Version History: ${this.entityName}</span>
        </div>
        <button class="close-button" @click=${this.close}>
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
      </div>

      <div class="popup-content">
        ${this.isLoading
          ? html`<div class="loading">Loading history...</div>`
          : this.error
          ? html`<div class="error">${this.error}</div>`
          : this.history.length === 0
          ? html`<div class="empty-state">No version history available</div>`
          : html`
              <ul class="history-list">
                ${this.history.map((item) => this.renderHistoryItem(item))}
              </ul>

              ${this.diffContent
                ? html`
                    <div class="diff-viewer">
                      <div class="diff-content">${this.diffContent}</div>
                    </div>
                  `
                : ''}

              ${this.selectedCommit
                ? html`
                    <div class="action-buttons">
                      <button
                        class="btn btn-primary"
                        @click=${this.handleRollback}
                        ?disabled=${this.isRollingBack}
                      >
                        ${this.isRollingBack ? 'Restoring...' : 'Restore This Version'}
                      </button>
                      <button
                        class="btn btn-secondary"
                        @click=${() => {
                          this.selectedCommit = null;
                          this.diffContent = null;
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  `
                : ''}
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'homeguardian-history-popup': HistoryPopup;
  }
}
