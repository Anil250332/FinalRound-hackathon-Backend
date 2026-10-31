import { offerService } from '../services/offer.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class OfferController {
  async create(req, res, next) {
    try {
      const offeringHospitalId = req.body.offeringHospitalId || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!offeringHospitalId) {
        return sendError(res, 'Offering hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const { requestId, offeredUnits, notes } = req.body;
      if (!requestId || !offeredUnits) {
        return sendError(res, 'requestId and offeredUnits are required', 'VALIDATION_ERROR', 400);
      }

      const offer = await offerService.createOffer(offeringHospitalId, { requestId, offeredUnits, notes }, req.user);
      return sendSuccess(res, 'Offer submitted successfully', offer, 201);
    } catch (error) {
      next(error);
    }
  }

  async getForRequest(req, res, next) {
    try {
      const offers = await offerService.getOffersForRequest(req.params.requestId);
      return sendSuccess(res, 'Offers retrieved', offers);
    } catch (error) {
      next(error);
    }
  }

  async getMyHospitalOffers(req, res, next) {
    try {
      const hospitalId = req.params.hospitalId || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!hospitalId) {
        return sendError(res, 'Hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const offers = await offerService.getHospitalOffers(hospitalId);
      return sendSuccess(res, 'Hospital offers retrieved', offers);
    } catch (error) {
      next(error);
    }
  }

  async accept(req, res, next) {
    try {
      const requestingHospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : req.body.requestingHospitalId;
      if (!requestingHospitalId) {
        return sendError(res, 'Requesting hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const result = await offerService.acceptOffer(req.params.id, requestingHospitalId, req.user);
      return sendSuccess(res, 'Offer accepted and transfer initiated', result);
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const requestingHospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : req.body.requestingHospitalId;
      const result = await offerService.rejectOffer(req.params.id, requestingHospitalId, req.user);
      return sendSuccess(res, 'Offer rejected', result);
    } catch (error) {
      next(error);
    }
  }
}

export const offerController = new OfferController();
