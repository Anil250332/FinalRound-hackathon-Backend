import { auditRepository } from '../repositories/audit.repository.js';

export class AuditService {
  async getAuditLogs(filter = {}) {
    return auditRepository.findAll(filter);
  }

  async logAction(userId, hospitalId, action, details = {}, ipAddress = null) {
    return auditRepository.create({
      userId,
      hospitalId,
      action,
      details,
      ipAddress,
    });
  }
}

export const auditService = new AuditService();
