import { Router } from 'express';
import { requestController } from '../controllers/request.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get requests
router.get('/', (req, res, next) => requestController.getAll(req, res, next));
router.get('/:id', (req, res, next) => requestController.getById(req, res, next));
router.get('/:id/matching', (req, res, next) => requestController.getMatching(req, res, next));

// Broadcast emergency request
router.post('/', authenticate, (req, res, next) => requestController.create(req, res, next));

// Accept emergency request (Connects two hospitals)
router.patch('/:id/accept', (req, res, next) => requestController.accept(req, res, next));

// Cancel emergency request
router.patch('/:id/cancel', authenticate, (req, res, next) => requestController.cancel(req, res, next));

export default router;
