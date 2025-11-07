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

    const unread = await notificationService.getUnread();

    res.json({
      success: true,
      notifications,
      unreadCount: unread.length,
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
