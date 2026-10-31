import { Router } from 'express';
import { offerController } from '../controllers/offer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get offers
router.get('/request/:requestId', (req, res, next) => offerController.getForRequest(req, res, next));
router.get('/hospital/:hospitalId', (req, res, next) => offerController.getMyHospitalOffers(req, res, next));

// Submit new offer
router.post('/', authenticate, (req, res, next) => offerController.create(req, res, next));

// Accept or reject offer
router.patch('/:id/accept', authenticate, (req, res, next) => offerController.accept(req, res, next));
router.patch('/:id/reject', authenticate, (req, res, next) => offerController.reject(req, res, next));

export default router;
