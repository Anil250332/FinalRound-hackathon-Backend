import { auditService } from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.js';

export class AuditController {
  async getAll(req, res, next) {
    try {
      const filter = {};
      if (req.query.hospitalId) {
        filter.hospitalId = req.query.hospitalId;
      }
      if (req.query.userId) {
        filter.userId = req.query.userId;
      }

      const logs = await auditService.getAuditLogs(filter);
      return sendSuccess(res, 'Audit logs retrieved', logs);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
