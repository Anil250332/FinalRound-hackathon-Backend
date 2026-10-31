import { Notification } from '../models/Notification.js';

export class NotificationRepository {
  async findByRecipient(hospitalId = null, userId = null, limit = 50) {
    const orConditions = [];
    if (hospitalId) orConditions.push({ recipientHospitalId: hospitalId });
    if (userId) orConditions.push({ recipientUserId: userId });

    const filter = orConditions.length > 0 ? { $or: orConditions } : {};
    return Notification.find(filter).sort({ createdAt: -1 }).limit(limit);
  }

  async create(data) {
    return Notification.create(data);
  }

  async markAsRead(id) {
    return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }

  async markAllAsRead(hospitalId = null, userId = null) {
    const orConditions = [];
    if (hospitalId) orConditions.push({ recipientHospitalId: hospitalId });
    if (userId) orConditions.push({ recipientUserId: userId });

    const filter = orConditions.length > 0 ? { $or: orConditions } : {};
    return Notification.updateMany(filter, { isRead: true });
  }

  async countUnread(hospitalId = null, userId = null) {
    const orConditions = [];
    if (hospitalId) orConditions.push({ recipientHospitalId: hospitalId });
    if (userId) orConditions.push({ recipientUserId: userId });

    const filter = { isRead: false };
    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }
    return Notification.countDocuments(filter);
  }
}

export const notificationRepository = new NotificationRepository();
