# Implementation Plan: Notification System

## Metadata

| Field | Value |
|-------|-------|
| **Plan ID** | FEAT-001 |
| **Status** | 🟠 HIGH PRIORITY |
| **Priority** | P1 |
| **Effort** | 6 hours |
| **Owner** | TBD |
| **Created** | 2025-11-07 |
| **Target Version** | v1.1.0 |
| **Dependencies** | None |

## Summary

Implement a comprehensive notification system that alerts users about backup failures, successful operations, errors, and important events through multiple channels (in-app, Home Assistant persistent notifications, and optional email/webhooks).

## Motivation

### User Pain Points
- Users don't know when backups fail
- No visibility into errors during automated operations
- Missed critical events (e.g., push failures, disk space warnings)

### Business Value
- Increased user confidence
- Proactive problem detection
- Better user engagement
- Professional feature parity

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Notification System                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Event Source (Backup, Restore, Push, etc.)            │
│         ↓                                                │
│  NotificationService.send()                              │
│         ↓                                                │
│  ┌──────────────────────────────────────┐               │
│  │         Notification Dispatcher       │               │
│  └──────────────────────────────────────┘               │
│         ↓                 ↓                ↓             │
│   Database          HA Persistent     Webhooks          │
│   (History)         Notification      (Discord/Slack)   │
│                                                          │
│  Frontend polls/subscribes to notifications             │
│         ↓                                                │
│  Display in UI (Badge, Toast, List)                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,           -- 'backup', 'restore', 'push', 'system'
  severity TEXT NOT NULL,       -- 'info', 'success', 'warning', 'error'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,                 -- JSON for additional context
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME           -- Optional expiry for auto-cleanup
);

CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_severity ON notifications(severity);
```

### Configuration Schema

Add to `config.yaml`:

```yaml
notifications:
  # In-app notifications (always enabled)
  enabled: true

  # Home Assistant persistent notifications
  ha_notifications:
    enabled: true
    severity_threshold: "warning"  # Only warning and error

  # Webhooks for external integrations
  webhooks:
    - name: "Discord"
      url: "https://discord.com/api/webhooks/..."
      enabled: false
      events: ["backup.failed", "push.failed"]

    - name: "Slack"
      url: "https://hooks.slack.com/services/..."
      enabled: false
      events: ["backup.failed", "push.failed", "system.error"]

  # Auto-cleanup old notifications
  retention_days: 30
```

## Implementation

### Phase 1: Core Notification Service (2 hours)

#### Task 1.1: Create Notification Service

**File:** `backend/services/notification-service.js`

```javascript
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
      `SELECT * FROM notifications
       WHERE read = 0
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Get all notifications with pagination
   */
  async getAll({ limit = 50, offset = 0, severity = null, type = null }) {
    let query = 'SELECT * FROM notifications WHERE 1=1';
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
```

#### Task 1.2: Update Database Schema

**File:** `backend/config/database.js`

```javascript
// Add to initialize() function
async function initialize() {
  // ... existing tables

  // Notifications table
  await db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);

  await db.run('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_notifications_severity ON notifications(severity)');

  logger.info('Notifications table initialized');
}
```

### Phase 2: API Endpoints (1 hour)

**File:** `backend/routes/notifications.js`

```javascript
const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification-service');
const logger = require('../utils/logger');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

// Validation schemas
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  severity: z.enum(['info', 'success', 'warning', 'error']).optional(),
  type: z.enum(['backup', 'restore', 'push', 'system']).optional()
});

const createNotificationSchema = z.object({
  type: z.enum(['backup', 'restore', 'push', 'system']),
  severity: z.enum(['info', 'success', 'warning', 'error']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  details: z.record(z.any()).optional()
});

/**
 * GET /api/notifications
 * Get all notifications with pagination
 */
router.get('/', validate(querySchema, 'query'), async (req, res) => {
  try {
    const { limit, offset, severity, type } = req.query;

    const notifications = await notificationService.getAll({
      limit,
      offset,
      severity,
      type
    });

    const unreadCount = await notificationService.getUnread();

    res.json({
      success: true,
      notifications,
      unreadCount: unreadCount.length,
      pagination: {
        limit,
        offset,
        total: notifications.length
      }
    });
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/unread
 * Get unread notifications
 */
router.get('/unread', async (req, res) => {
  try {
    const notifications = await notificationService.getUnread();

    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    logger.error('Failed to get unread notifications:', error);
    res.status(500).json({
      error: 'Failed to get unread notifications',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification (for testing/manual use)
 */
router.post('/', validate(createNotificationSchema), async (req, res) => {
  try {
    const { type, severity, title, message, details } = req.body;

    const id = await notificationService.send({
      type,
      severity,
      title,
      message,
      details
    });

    res.json({
      success: true,
      id,
      message: 'Notification created'
    });
  } catch (error) {
    logger.error('Failed to create notification:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await notificationService.markAsRead(parseInt(id));

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res) => {
  try {
    await notificationService.markAllAsRead();

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Failed to mark all as read:', error);
    res.status(500).json({
      error: 'Failed to mark all as read',
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await notificationService.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error('Failed to delete notification:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

module.exports = router;
```

**Update:** `backend/server.js`

```javascript
const notificationRoutes = require('./routes/notifications');

// Add route
app.use('/api/notifications', notificationRoutes);
```

### Phase 3: Integrate with Existing Services (1.5 hours)

#### Update File Watcher

**File:** `backend/services/file-watcher.js`

```javascript
const notificationService = require('./notification-service');

async createAutoCommit() {
  // ... existing code

  try {
    const result = await this.gitService.createCommit(message, true, false);

    if (result) {
      logger.info(`Auto-commit created: ${result.hash.substring(0, 7)}`);

      // Send success notification
      await notificationService.send({
        type: 'backup',
        severity: 'success',
        title: 'Auto-backup completed',
        message: `${filesArray.length} file(s) backed up`,
        details: {
          commitHash: result.hash,
          filesChanged: filesArray.length
        }
      });

      // Auto-push if enabled
      if (process.env.AUTO_PUSH_ENABLED === 'true') {
        try {
          await this.gitService.push();
          logger.info('Auto-push successful');
        } catch (error) {
          logger.error('Auto-push failed:', error);

          // Send failure notification
          await notificationService.send({
            type: 'push',
            severity: 'error',
            title: 'Auto-push failed',
            message: error.message,
            details: {
              commitHash: result.hash,
              error: error.message
            }
          });
        }
      }
    }

    this.changedFiles.clear();
  } catch (error) {
    logger.error('Failed to create auto-commit:', error);

    // Send error notification
    await notificationService.send({
      type: 'backup',
      severity: 'error',
      title: 'Auto-backup failed',
      message: error.message,
      details: {
        filesChanged: filesArray.length,
        error: error.message
      }
    });
  }
}
```

#### Update Scheduler

**File:** `backend/services/scheduler.js`

```javascript
const notificationService = require('./notification-service');

async runScheduledBackup() {
  try {
    logger.info('Running scheduled backup...');

    const result = await this.gitService.createCommit(
      `Scheduled backup: ${new Date().toISOString()}`,
      false,
      true
    );

    if (result) {
      logger.info('Scheduled backup completed');

      await notificationService.send({
        type: 'backup',
        severity: 'success',
        title: 'Scheduled backup completed',
        message: `${result.filesChanged.length} file(s) backed up`,
        details: {
          commitHash: result.hash,
          scheduled: true
        }
      });
    }
  } catch (error) {
    logger.error('Scheduled backup failed:', error);

    await notificationService.send({
      type: 'backup',
      severity: 'error',
      title: 'Scheduled backup failed',
      message: error.message,
      details: {
        scheduled: true,
        error: error.message
      }
    });
  }
}
```

### Phase 4: Frontend Implementation (1.5 hours)

**File:** `frontend/src/api/client.js` (update)

```javascript
export const api = {
  // ... existing methods

  notifications: {
    getAll: (params) => axios.get('/api/notifications', { params }),
    getUnread: () => axios.get('/api/notifications/unread'),
    markAsRead: (id) => axios.put(`/api/notifications/${id}/read`),
    markAllAsRead: () => axios.put('/api/notifications/read-all'),
    delete: (id) => axios.delete(`/api/notifications/${id}`)
  }
};
```

**File:** `frontend/src/components/NotificationBadge.jsx`

```jsx
import { Badge, IconButton, Menu, MenuItem, Typography, Box, Chip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBadge() {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.notifications.getUnread();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      await fetchNotifications();
      handleClose();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('notifications.title')}
          </Typography>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={handleMarkAllAsRead}
            >
              {t('notifications.markAllRead')}
            </Typography>
          )}
        </Box>

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {t('notifications.empty')}
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="subtitle2">
                  {notification.title}
                </Typography>
                <Chip
                  label={notification.severity}
                  size="small"
                  color={getSeverityColor(notification.severity)}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
```

**File:** `frontend/src/components/Layout.jsx` (update)

```jsx
import NotificationBadge from './NotificationBadge';

// In AppBar
<AppBar>
  <Toolbar>
    {/* ... existing items */}
    <NotificationBadge />
  </Toolbar>
</AppBar>
```

## Testing

```javascript
describe('NotificationService', () => {
  test('should create notification', async () => {
    const id = await notificationService.send({
      type: 'backup',
      severity: 'success',
      title: 'Test',
      message: 'Test message'
    });

    expect(id).toBeTruthy();

    const notifications = await notificationService.getUnread();
    expect(notifications).toHaveLength(1);
  });

  test('should mark as read', async () => {
    const id = await notificationService.send({
      type: 'backup',
      severity: 'info',
      title: 'Test',
      message: 'Test'
    });

    await notificationService.markAsRead(id);

    const unread = await notificationService.getUnread();
    expect(unread).toHaveLength(0);
  });
});
```

## Success Metrics

- ✅ 95%+ notification delivery rate
- ✅ < 100ms notification creation time
- ✅ User satisfaction with visibility
- ✅ Reduced support tickets for "missed errors"

---

**Status:** ✅ Ready for Implementation
