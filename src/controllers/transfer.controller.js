import { transferService } from '../services/transfer.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class TransferController {
  async getById(req, res, next) {
    try {
      const transfer = await transferService.getTransferById(req.params.id);
      return sendSuccess(res, 'Transfer details retrieved', transfer);
    } catch (error) {
      next(error);
    }
  }

  async getMyHospitalTransfers(req, res, next) {
    try {
      const hospitalId = req.params.hospitalId || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!hospitalId) {
        return sendError(res, 'Hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const transfers = await transferService.getHospitalTransfers(hospitalId);
      return sendSuccess(res, 'Hospital transfers retrieved', transfers);
    } catch (error) {
      next(error);
    }
  }

  async initiateDispatch(req, res, next) {
    try {
      const supplyingHospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : req.body.supplyingHospitalId;
      if (!supplyingHospitalId) {
        return sendError(res, 'Supplying hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const { driverContact, vehicleNumber } = req.body;
      const transfer = await transferService.initiateDispatch(
        req.params.id,
        supplyingHospitalId,
        { driverContact, vehicleNumber },
        req.user
      );
      return sendSuccess(res, 'Dispatch initiated successfully', transfer);
    } catch (error) {
      next(error);
    }
  }

  async verifyHandoverOTP(req, res, next) {
    try {
      const requestingHospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : req.body.requestingHospitalId;
      if (!requestingHospitalId) {
        return sendError(res, 'Requesting hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const { otp } = req.body;
      if (!otp) {
        return sendError(res, 'Verification OTP is required', 'VALIDATION_ERROR', 400);
      }

      const transfer = await transferService.verifyHandoverOTP(
        req.params.id,
        requestingHospitalId,
        otp,
        req.user
      );
      return sendSuccess(res, 'Transfer handover verified and completed successfully!', transfer);
    } catch (error) {
      next(error);
    }
  }
}

export const transferController = new TransferController();
