import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.get('/demo-users', (req, res, next) => authController.getDemoUsers(req, res, next));

// Protected routes
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.post(
  '/staff',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'HOSPITAL_ADMIN'),
  (req, res, next) => authController.createStaff(req, res, next)
);

export default router;
