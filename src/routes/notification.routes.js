import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, (req, res, next) => notificationController.getMyNotifications(req, res, next));
router.patch('/:id/read', authenticate, (req, res, next) => notificationController.markRead(req, res, next));
router.patch('/read-all', authenticate, (req, res, next) => notificationController.markAllRead(req, res, next));

export default router;
