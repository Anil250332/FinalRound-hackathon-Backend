import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

// Read inventory (can be accessed with or without auth for demo flexibility)
router.get('/hospital/:hospitalId', (req, res, next) => inventoryController.getByHospital(req, res, next));
router.get('/hospital/:hospitalId/summary', (req, res, next) => inventoryController.getSummary(req, res, next));

// Modify inventory (Blood Bank Officers and Hospital Admins)
router.post(
  '/',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BLOOD_BANK_OFFICER'),
  (req, res, next) => inventoryController.addOrUpdate(req, res, next)
);

router.patch(
  '/:id/units',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BLOOD_BANK_OFFICER'),
  (req, res, next) => inventoryController.updateUnits(req, res, next)
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BLOOD_BANK_OFFICER'),
  (req, res, next) => inventoryController.delete(req, res, next)
);

export default router;
