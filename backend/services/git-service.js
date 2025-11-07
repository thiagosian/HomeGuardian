const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const db = require('../config/database');

class GitService {
  constructor() {
    this.configPath = process.env.CONFIG_PATH || '/config';
    this.dataPath = process.env.DATA_PATH || '/data';
    this.gitPath = path.join(this.configPath, '.git');
    this.git = simpleGit(this.configPath);

    // Git user configuration from environment
    this.gitUserName = process.env.GIT_USER_NAME || 'HomeGuardian';
    this.gitUserEmail = process.env.GIT_USER_EMAIL || 'homeguardian@homeassistant.local';
  }

  async initialize() {
    try {
      // Check if .git directory exists
      const isRepo = await this.isGitRepository();

      if (!isRepo) {
        logger.info('Git repository not found. Initializing...');
        await this.git.init();

        // Configure git user
        await this.git.addConfig('user.name', this.gitUserName);
        await this.git.addConfig('user.email', this.gitUserEmail);

        // Create .gitignore if it doesn't exist or if exclude_secrets is enabled
        await this.createGitignore();

        // Initial commit
        await this.createInitialCommit();

        logger.info('Git repository initialized successfully');
      } else {
        logger.info('Git repository already exists');

        // Ensure git config is set
        await this.git.addConfig('user.name', this.gitUserName);
        await this.git.addConfig('user.email', this.gitUserEmail);
      }

      return true;
    } catch (error) {
      logger.error('Failed to initialize Git repository:', error);
      throw error;
    }
  }

  async isGitRepository() {
    try {
      await fs.access(this.gitPath);
      return true;
    } catch {
      return false;
    }
  }

  async createGitignore() {
    const gitignorePath = path.join(this.configPath, '.gitignore');
    const excludeSecrets = process.env.EXCLUDE_SECRETS === 'true';
    const backupLovelace = process.env.BACKUP_LOVELACE !== 'false'; // Default to true

    const defaultIgnores = [
      '# HomeGuardian default exclusions',
      '.git/',
      '*.db',
      '*.db-journal',
      '*.log',
      'home-assistant.log*',
      'home-assistant_v2.db*',
      '.cloud/',
      '.google.token',
      'www/community/',
      'deps/',
      'tts/',
      '__pycache__/',
      '*.pyc',
      '.HA_VERSION',
      '.uuid',
      ''
    ];

    // Conditionally exclude Lovelace dashboards
    if (!backupLovelace) {
      defaultIgnores.splice(7, 0, '.storage/lovelace*');
    }

    if (excludeSecrets) {
      defaultIgnores.push('# Secrets excluded by HomeGuardian');
      defaultIgnores.push('secrets.yaml');
      defaultIgnores.push('');
    }

    try {
      // Check if .gitignore already exists
      const exists = await fs.access(gitignorePath).then(() => true).catch(() => false);

      if (!exists) {
        await fs.writeFile(gitignorePath, defaultIgnores.join('\n'));
        logger.info('.gitignore created');
      } else {
        logger.info('.gitignore already exists');
      }
    } catch (error) {
      logger.error('Failed to create .gitignore:', error);
      throw error;
    }
  }

  async createInitialCommit() {
    try {
      await this.git.add('.gitignore');
      await this.git.commit('Initial commit by HomeGuardian');
      logger.info('Initial commit created');

      // Record in database
      const log = await this.git.log({ maxCount: 1 });
      if (log.latest) {
        await db.run(
          'INSERT INTO backup_history (commit_hash, commit_message, commit_date, is_auto) VALUES (?, ?, ?, ?)',
          [log.latest.hash, log.latest.message, log.latest.date, 0]
        );
      }
    } catch (error) {
      logger.error('Failed to create initial commit:', error);
      throw error;
    }
  }

  async createCommit(message, isAuto = true, isScheduled = false) {
    try {
      // Check if there are changes
      const status = await this.git.status();

      if (!status.isClean()) {
        // Stage all changes
        await this.git.add('.');

        // Create commit
        const commitMessage = message || `Auto-save: ${new Date().toISOString()}`;
        await this.git.commit(commitMessage);

        const log = await this.git.log({ maxCount: 1 });

        if (log.latest) {
          // Record in database
          const filesChanged = status.files.map(f => f.path).join(',');
          await db.run(
            'INSERT INTO backup_history (commit_hash, commit_message, commit_date, files_changed, is_auto, is_scheduled) VALUES (?, ?, ?, ?, ?, ?)',
            [log.latest.hash, log.latest.message, log.latest.date, filesChanged, isAuto ? 1 : 0, isScheduled ? 1 : 0]
          );

          logger.info(`Commit created: ${log.latest.hash.substring(0, 7)} - ${commitMessage}`);

          return {
            hash: log.latest.hash,
            message: log.latest.message,
            date: log.latest.date,
            filesChanged: status.files
          };
        }
      } else {
        logger.info('No changes to commit');
        return null;
      }
    } catch (error) {
      logger.error('Failed to create commit:', error);
      throw error;
    }
  }

  async getHistory(limit = 50, offset = 0) {
    try {
      const log = await this.git.log({
        maxCount: limit,
        from: offset
      });

      return log.all.map(commit => ({
        hash: commit.hash,
        shortHash: commit.hash.substring(0, 7),
        message: commit.message,
        date: commit.date,
        author: commit.author_name
      }));
    } catch (error) {
      logger.error('Failed to get history:', error);
      throw error;
    }
  }

  async getCommitDiff(commitHash) {
    try {
      const diff = await this.git.diff([`${commitHash}^`, commitHash]);
      return diff;
    } catch (error) {
      logger.error('Failed to get commit diff:', error);
      throw error;
    }
  }

  async getFileDiff(filePath, commitHash = 'HEAD') {
    try {
      const diff = await this.git.diff([commitHash, '--', filePath]);
      return diff;
    } catch (error) {
      logger.error('Failed to get file diff:', error);
      throw error;
    }
  }

  async getFileContent(filePath, commitHash = 'HEAD') {
    try {
      const content = await this.git.show([`${commitHash}:${filePath}`]);
      return content;
    } catch (error) {
      logger.error('Failed to get file content:', error);
      throw error;
    }
  }

  async restoreFile(filePath, commitHash) {
    try {
      // Create safety backup first
      await this.createCommit('Safety backup before restoration', false, false);

      // Restore file
      await this.git.checkout([commitHash, '--', filePath]);

      logger.info(`File restored: ${filePath} from ${commitHash}`);

      return true;
    } catch (error) {
      logger.error('Failed to restore file:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const status = await this.git.status();
      return {
        isClean: status.isClean(),
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        files: status.files
      };
    } catch (error) {
      logger.error('Failed to get status:', error);
      throw error;
    }
  }

  async configureRemote(remoteUrl, remoteName = 'origin') {
    try {
      // Check if remote exists
      const remotes = await this.git.getRemotes();
      const existingRemote = remotes.find(r => r.name === remoteName);

      if (existingRemote) {
        // Update remote URL
        await this.git.remote(['set-url', remoteName, remoteUrl]);
        logger.info(`Remote '${remoteName}' updated`);
      } else {
        // Add new remote
        await this.git.addRemote(remoteName, remoteUrl);
        logger.info(`Remote '${remoteName}' added`);
      }

      // Save to database
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['remote_url', remoteUrl]
      );

      return true;
    } catch (error) {
      logger.error('Failed to configure remote:', error);
      throw error;
    }
  }

  async push(remoteName = 'origin', branch = 'main') {
    try {
      logger.info(`Pushing to ${remoteName}/${branch}...`);

      // Get current branch
      const status = await this.git.status();
      const currentBranch = status.current;

      // Push to remote
      await this.git.push(remoteName, currentBranch || branch, ['--set-upstream']);

      logger.info('Push successful');

      // Update push status in database
      await db.run(
        'UPDATE backup_history SET push_status = ? WHERE push_status = ?',
        ['synced', 'pending']
      );

      return true;
    } catch (error) {
      logger.error('Push failed:', error);

      // Update push status in database
      await db.run(
        'UPDATE backup_history SET push_status = ? WHERE push_status = ?',
        ['failed', 'pending']
      );

      throw error;
    }
  }

  async testRemoteConnection(remoteName = 'origin') {
    try {
      await this.git.fetch(remoteName, [], { '--dry-run': null });
      return true;
    } catch (error) {
      logger.error('Remote connection test failed:', error);
      return false;
    }
  }
}

module.exports = GitService;
