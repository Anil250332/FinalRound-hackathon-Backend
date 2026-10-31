import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get users (optionally filtered by hospitalId or query params)
router.get('/', (req, res, next) => userController.getAll(req, res, next));
router.get('/hospital/:hospitalId', (req, res, next) => userController.getByHospital(req, res, next));
router.get('/:id', (req, res, next) => userController.getById(req, res, next));

// Create user (Hospital Head adding officer or Super Admin adding users)
router.post('/', (req, res, next) => userController.create(req, res, next));

// Update user details
router.put('/:id', (req, res, next) => userController.update(req, res, next));

// Toggle active/inactive status
router.patch('/:id/status', (req, res, next) => userController.toggleStatus(req, res, next));

// Delete user
router.delete('/:id', (req, res, next) => userController.delete(req, res, next));

export default router;
