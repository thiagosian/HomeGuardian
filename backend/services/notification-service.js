const db = require('../config/database');
const logger = require('../utils/logger');
const axios = require('axios');

class NotificationService {
  constructor() {
    this.haUrl = process.env.SUPERVISOR_URL || 'http://supervisor/core';
    this.haToken = process.env.SUPERVISOR_TOKEN;
  }

  /**
   * Send a notification through all configured channels
   * @param {Object} notification
   * @param {string} notification.type - backup, restore, push, system
   * @param {string} notification.severity - info, success, warning, error
   * @param {string} notification.title
   * @param {string} notification.message
   * @param {Object} notification.details - Additional context
   */
  async send({ type, severity, title, message, details = {} }) {
    try {
      // Validate inputs
      if (!type || !severity || !title || !message) {
        throw new Error('Missing required notification fields');
      }

      // Store in database
      const notificationId = await this.storeNotification({
        type,
        severity,
        title,
        message,
        details
      });

      logger.info('Notification created', {
        id: notificationId,
        type,
        severity,
        title
      });

      // Send to Home Assistant (if enabled)
      if (this.shouldSendToHA(severity)) {
        await this.sendToHomeAssistant({ type, severity, title, message });
      }

      // Send to webhooks (if configured)
      await this.sendToWebhooks({ type, severity, title, message, details });

      return notificationId;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Store notification in database
   */
  async storeNotification({ type, severity, title, message, details }) {
    const result = await db.run(
      `INSERT INTO notifications (type, severity, title, message, details)
       VALUES (?, ?, ?, ?, ?)`,
      [type, severity, title, message, JSON.stringify(details)]
    );

    return result.lastID;
  }

  /**
   * Send notification to Home Assistant
   */
  async sendToHomeAssistant({ severity, title, message }) {
    if (!this.haUrl || !this.haToken) {
      logger.warn('Home Assistant not configured for notifications');
      return;
    }

    try {
      const notificationId = `homeguardian_${Date.now()}`;

      await axios.post(
        `${this.haUrl}/api/services/persistent_notification/create`,
        {
          title: `HomeGuardian: ${title}`,
          message,
          notification_id: notificationId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.haToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Notification sent to Home Assistant', { notificationId });
    } catch (error) {
      logger.error('Failed to send notification to Home Assistant:', error);
    }
  }

  /**
   * Send notification to configured webhooks
   */
  async sendToWebhooks({ type, severity, title, message, details }) {
    const webhooks = await this.getConfiguredWebhooks();
    const event = `${type}.${severity}`;

    for (const webhook of webhooks) {
      if (!webhook.enabled) continue;

      // Check if webhook is subscribed to this event
      if (webhook.events && !webhook.events.includes(event)) {
        continue;
      }

      try {
        await axios.post(webhook.url, {
          event,
          severity,
          title,
          message,
          details,
          timestamp: new Date().toISOString(),
          source: 'HomeGuardian'
        }, {
          timeout: 5000
        });

        logger.info('Notification sent to webhook', {
          name: webhook.name,
          url: webhook.url
        });
      } catch (error) {
        logger.error(`Failed to send notification to webhook ${webhook.name}:`, error);
      }
    }
  }

  /**
   * Get configured webhooks from settings
   */
  async getConfiguredWebhooks() {
    try {
      const setting = await db.get(
        'SELECT value FROM settings WHERE key = ?',
        ['webhooks']
      );

      if (!setting) return [];

      return JSON.parse(setting.value) || [];
    } catch (error) {
      logger.error('Failed to get webhooks config:', error);
      return [];
    }
  }

  /**
   * Check if notification should be sent to HA based on severity
   */
  shouldSendToHA(severity) {
    const haNotificationsEnabled = process.env.HA_NOTIFICATIONS_ENABLED === 'true';
    const severityThreshold = process.env.HA_NOTIFICATIONS_THRESHOLD || 'warning';

    if (!haNotificationsEnabled) return false;

    const severityLevels = { info: 0, success: 1, warning: 2, error: 3 };
    const threshold = severityLevels[severityThreshold] || 2;
    const current = severityLevels[severity] || 0;

    return current >= threshold;
  }

  /**
   * Get unread notifications
   */
  async getUnread(limit = 50) {
    return await db.all(
      `SELECT id, type, severity, title, message, read, created_at
       FROM notifications
       WHERE read = 0
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Get all notifications with pagination (optimized - excludes large 'details' field)
   */
  async getAll({ limit = 50, offset = 0, severity = null, type = null }) {
    let query = 'SELECT id, type, severity, title, message, read, created_at FROM notifications WHERE 1=1';
    const params = [];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.all(query, params);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    await db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    await db.run('UPDATE notifications SET read = 1');
  }

  /**
   * Delete notification
   */
  async delete(id) {
    await db.run('DELETE FROM notifications WHERE id = ?', [id]);
  }

  /**
   * Clean up old notifications
   */
  async cleanup(retentionDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.run(
      'DELETE FROM notifications WHERE created_at < ?',
      [cutoffDate.toISOString()]
    );

    logger.info(`Cleaned up old notifications`, {
      deleted: result.changes,
      cutoffDate
    });

    return result.changes;
  }
}

module.exports = new NotificationService();
