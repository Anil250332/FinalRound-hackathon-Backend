import { requestService } from '../services/request.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class RequestController {
  async create(req, res, next) {
    try {
      const hospitalId = req.body.requestingHospitalId || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!hospitalId) {
        return sendError(res, 'Requesting hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const { bloodGroup, component, requiredUnits, urgency, requiredBy, additionalNotes } = req.body;
      if (!bloodGroup || !component || !requiredUnits) {
        return sendError(res, 'bloodGroup, component, and requiredUnits are required', 'VALIDATION_ERROR', 400);
      }

      const result = await requestService.createEmergencyRequest(
        hospitalId,
        { bloodGroup, component, requiredUnits, urgency, requiredBy, additionalNotes },
        req.user
      );

      return sendSuccess(res, 'Emergency request broadcasted successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.hospitalId) {
        filter.requestingHospitalId = req.query.hospitalId;
      }

      const requests = await requestService.getAllRequests(filter);
      return sendSuccess(res, 'Emergency requests retrieved', requests);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const request = await requestService.getRequestById(req.params.id);
      return sendSuccess(res, 'Emergency request retrieved', request);
    } catch (error) {
      next(error);
    }
  }

  async getMatching(req, res, next) {
    try {
      const request = await requestService.getRequestById(req.params.id);
      const matches = await requestService.findMatchingHospitals(request);
      return sendSuccess(res, 'Matching hospitals retrieved', matches);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const hospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : null;
      const cancelled = await requestService.cancelRequest(req.params.id, hospitalId, req.user);
      return sendSuccess(res, 'Emergency request cancelled', cancelled);
    } catch (error) {
      next(error);
    }
  }

  async accept(req, res, next) {
    try {
      const hospitalId =
        req.body.hospitalId ||
        (req.user && req.user.hospitalId ? (req.user.hospitalId._id || req.user.hospitalId) : null);

      if (!hospitalId) {
        return sendError(res, 'Accepting hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const accepted = await requestService.acceptEmergencyRequest(req.params.id, hospitalId, req.user);
      return sendSuccess(res, 'Emergency request accepted successfully', accepted);
    } catch (error) {
      return sendError(res, error.message, 'ACCEPT_FAILED', 400);
    }
  }
}

export const requestController = new RequestController();
