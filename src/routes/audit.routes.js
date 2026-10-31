import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'),
  (req, res, next) => auditController.getAll(req, res, next)
);

export default router;
