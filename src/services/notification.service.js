import { notificationRepository } from '../repositories/notification.repository.js';

export class NotificationService {
  async getNotifications(hospitalId, userId) {
    return notificationRepository.findByRecipient(hospitalId, userId);
  }

  async markAsRead(id) {
    return notificationRepository.markAsRead(id);
  }

  async markAllAsRead(hospitalId, userId) {
    return notificationRepository.markAllAsRead(hospitalId, userId);
  }

  async getUnreadCount(hospitalId, userId) {
    return notificationRepository.countUnread(hospitalId, userId);
  }
}

export const notificationService = new NotificationService();
