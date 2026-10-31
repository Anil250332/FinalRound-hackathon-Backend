import { notificationService } from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.js';

export class NotificationController {
  async getMyNotifications(req, res, next) {
    try {
      const hospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : null;
      const userId = req.user ? req.user._id : null;

      const notifications = await notificationService.getNotifications(hospitalId, userId);
      const unreadCount = await notificationService.getUnreadCount(hospitalId, userId);

      return sendSuccess(res, 'Notifications retrieved', { notifications, unreadCount });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.params.id);
      return sendSuccess(res, 'Notification marked as read', updated);
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const hospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : null;
      const userId = req.user ? req.user._id : null;

      await notificationService.markAllAsRead(hospitalId, userId);
      return sendSuccess(res, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
