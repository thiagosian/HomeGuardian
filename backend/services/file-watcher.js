const chokidar = require('chokidar');
const path = require('path');
const logger = require('../utils/logger');

class FileWatcher {
  constructor(gitService) {
    this.gitService = gitService;
    this.configPath = process.env.CONFIG_PATH || '/config';
    this.debounceTime = parseInt(process.env.AUTO_COMMIT_DEBOUNCE || '60') * 1000;
    this.watcher = null;
    this.debounceTimer = null;
    this.changedFiles = new Set();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('File watcher is already running');
      return;
    }

    try {
      // Files and directories to ignore
      const ignored = [
        '**/node_modules/**',
        '**/.git/**',
        '**/.git',
        '**/home-assistant.log*',
        '**/home-assistant_v2.db*',
        '**/*.db',
        '**/*.db-journal',
        '**/.storage/lovelace*',
        '**/.cloud/**',
        '**/deps/**',
        '**/tts/**',
        '**/__pycache__/**',
        '**/.HA_VERSION',
        '**/.uuid'
      ];

      this.watcher = chokidar.watch(this.configPath, {
        ignored: ignored,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });

      this.watcher
        .on('add', (filePath) => this.handleFileChange('added', filePath))
        .on('change', (filePath) => this.handleFileChange('modified', filePath))
        .on('unlink', (filePath) => this.handleFileChange('deleted', filePath))
        .on('error', (error) => logger.error('Watcher error:', error));

      this.isRunning = true;
      logger.info(`File watcher started on ${this.configPath}`);
      logger.info(`Debounce time: ${this.debounceTime / 1000}s`);
    } catch (error) {
      logger.error('Failed to start file watcher:', error);
      throw error;
    }
  }

  handleFileChange(eventType, filePath) {
    const relativePath = path.relative(this.configPath, filePath);

    logger.debug(`File ${eventType}: ${relativePath}`);

    this.changedFiles.add({
      path: relativePath,
      type: eventType,
      timestamp: new Date()
    });

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.createAutoCommit();
    }, this.debounceTime);
  }

  async createAutoCommit() {
    if (this.changedFiles.size === 0) {
      return;
    }

    try {
      const filesArray = Array.from(this.changedFiles);
      const fileNames = filesArray.map(f => f.path).join(', ');

      logger.info(`Creating auto-commit for ${filesArray.length} changed file(s)`);

      const message = `Auto-save: ${fileNames}`;
      const result = await this.gitService.createCommit(message, true, false);

      if (result) {
        logger.info(`Auto-commit created: ${result.hash.substring(0, 7)}`);

        // Auto-push if enabled
        if (process.env.AUTO_PUSH_ENABLED === 'true') {
          try {
            await this.gitService.push();
            logger.info('Auto-push successful');
          } catch (error) {
            logger.error('Auto-push failed:', error);
          }
        }
      }

      // Clear changed files
      this.changedFiles.clear();
    } catch (error) {
      logger.error('Failed to create auto-commit:', error);
    }
  }

  async stop() {
    if (!this.isRunning) {
      logger.warn('File watcher is not running');
      return;
    }

    try {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      if (this.watcher) {
        await this.watcher.close();
      }

      this.isRunning = false;
      logger.info('File watcher stopped');
    } catch (error) {
      logger.error('Failed to stop file watcher:', error);
      throw error;
    }
  }

  async pause() {
    if (this.watcher) {
      await this.watcher.close();
      this.isRunning = false;
      logger.info('File watcher paused');
    }
  }

  async resume() {
    await this.start();
    logger.info('File watcher resumed');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      changedFiles: Array.from(this.changedFiles),
      debounceTime: this.debounceTime
    };
  }
}

module.exports = FileWatcher;
