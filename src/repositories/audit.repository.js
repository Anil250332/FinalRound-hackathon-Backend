import { AuditLog } from '../models/AuditLog.js';

export class AuditRepository {
  async findAll(filter = {}, limit = 100) {
    return AuditLog.find(filter)
      .populate('userId', 'name email role')
      .populate('hospitalId', 'name hospitalCode')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async create(data) {
    return AuditLog.create(data);
  }

  async count(filter = {}) {
    return AuditLog.countDocuments(filter);
  }
}

export const auditRepository = new AuditRepository();
