import { Router } from 'express';
import { transferController } from '../controllers/transfer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get transfers
router.get('/:id', (req, res, next) => transferController.getById(req, res, next));
router.get('/hospital/:hospitalId', (req, res, next) => transferController.getMyHospitalTransfers(req, res, next));

// Initiate dispatch (by supplying hospital)
router.patch('/:id/dispatch', authenticate, (req, res, next) => transferController.initiateDispatch(req, res, next));

// Verify handover OTP (by receiving hospital)
router.patch('/:id/verify-otp', authenticate, (req, res, next) => transferController.verifyHandoverOTP(req, res, next));

export default router;
