import { Router } from 'express';
import { hospitalController } from '../controllers/hospital.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

// Public / Demo accessible
router.get('/', (req, res, next) => hospitalController.getAll(req, res, next));
router.get('/:id', (req, res, next) => hospitalController.getById(req, res, next));
router.get('/:id/nearby', (req, res, next) => hospitalController.getNearby(req, res, next));

// Protected hospital management routes
router.post('/', authenticate, authorizeRoles('SUPER_ADMIN'), (req, res, next) =>
  hospitalController.create(req, res, next)
);
router.put('/:id', authenticate, authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'), (req, res, next) =>
  hospitalController.update(req, res, next)
);
router.patch('/:id/verify', authenticate, authorizeRoles('SUPER_ADMIN'), (req, res, next) =>
  hospitalController.updateVerification(req, res, next)
);

export default router;
