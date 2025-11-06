const cron = require('node-cron');
const logger = require('../utils/logger');

class Scheduler {
  constructor(gitService) {
    this.gitService = gitService;
    this.scheduledTime = process.env.SCHEDULED_BACKUP_TIME || '03:00';
    this.cronJob = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    try {
      // Parse time (format: "HH:mm")
      const [hour, minute] = this.scheduledTime.split(':');

      // Create cron expression (minute hour * * *)
      const cronExpression = `${minute} ${hour} * * *`;

      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      this.cronJob = cron.schedule(cronExpression, async () => {
        logger.info('Scheduled backup starting...');
        await this.performScheduledBackup();
      });

      this.isRunning = true;
      logger.info(`Scheduler started. Backups scheduled for ${this.scheduledTime} daily`);
    } catch (error) {
      logger.error('Failed to start scheduler:', error);
      throw error;
    }
  }

  async performScheduledBackup() {
    try {
      const timestamp = new Date().toISOString();
      const message = `Scheduled backup: ${timestamp}`;

      const result = await this.gitService.createCommit(message, false, true);

      if (result) {
        logger.info(`Scheduled backup created: ${result.hash.substring(0, 7)}`);

        // Auto-push if enabled
        if (process.env.AUTO_PUSH_ENABLED === 'true') {
          try {
            await this.gitService.push();
            logger.info('Scheduled backup pushed to remote');
          } catch (error) {
            logger.error('Failed to push scheduled backup:', error);
          }
        }
      } else {
        logger.info('Scheduled backup: no changes to commit');
      }
    } catch (error) {
      logger.error('Scheduled backup failed:', error);
    }
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledTime: this.scheduledTime
    };
  }

  updateSchedule(newTime) {
    this.scheduledTime = newTime;

    if (this.isRunning) {
      this.stop();
      this.start();
      logger.info(`Schedule updated to ${newTime}`);
    }
  }
}

module.exports = Scheduler;
