import axios from 'axios';

const API_BASE_URL = './api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods
// NOTE: URLs must NOT start with '/' to respect the baseURL for ingress compatibility
export const api = {
  // Health check
  health: () => client.get('health'),

  // Backup operations
  backup: {
    now: (message) => client.post('backup/now', { message }),
    getStatus: () => client.get('backup/status'),
    pauseWatcher: () => client.post('backup/watcher/pause'),
    resumeWatcher: () => client.post('backup/watcher/resume'),
    getWatcherStatus: () => client.get('backup/watcher/status'),
  },

  // History operations
  history: {
    list: (limit = 50, offset = 0) => client.get(`history?limit=${limit}&offset=${offset}`),
    getCommit: (commitHash) => client.get(`history/${commitHash}`),
    getFileDiff: (commitHash, filePath) =>
      client.get(`history/${commitHash}/file?filePath=${encodeURIComponent(filePath)}`),
    getFileContent: (commitHash, filePath) =>
      client.get(`history/${commitHash}/content?filePath=${encodeURIComponent(filePath)}`),
    getItems: () => client.get('history/items/all'),
    getChangedItems: (commitHash) => client.get(`history/${commitHash}/items`),
  },

  // Restore operations
  restore: {
    file: (filePath, commitHash) => client.post('restore/file', { filePath, commitHash }),
    item: (type, id, commitHash) => client.post('restore/item', { type, id, commitHash }),
    reload: (domain) => client.post(`restore/reload/${domain}`),
  },

  // Settings
  settings: {
    getAll: () => client.get('settings'),
    update: (key, value, encrypted = false) =>
      client.post('settings', { key, value, encrypted }),
    generateSSH: () => client.post('settings/ssh/generate'),
    getPublicKey: () => client.get('settings/ssh/public-key'),
    configureRemote: (remoteUrl, authType, token) =>
      client.post('settings/remote', { remoteUrl, authType, token }),
    testRemote: () => client.post('settings/remote/test'),
    pushToRemote: () => client.post('settings/remote/push'),
  },

  // Status
  status: {
    get: () => client.get('status'),
    getStats: () => client.get('status/stats'),
  },
};

export default client;
