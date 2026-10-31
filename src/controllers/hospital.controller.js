import { hospitalService } from '../services/hospital.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HospitalController {
  async getAll(req, res, next) {
    try {
      const hospitals = await hospitalService.getAllHospitals();
      return sendSuccess(res, 'Hospitals retrieved', hospitals);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const hospital = await hospitalService.getHospitalById(req.params.id);
      return sendSuccess(res, 'Hospital retrieved', hospital);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, hospitalCode, address, city, coordinates, contact, role, adminName, adminEmail, adminPassword } = req.body;
      if (!name || !hospitalCode || !address || !coordinates || !contact) {
        return sendError(res, 'Missing required hospital fields', 'VALIDATION_ERROR', 400);
      }

      const contactObj = typeof contact === 'object' && contact !== null ? contact : {};
      const safeContact = {
        phone: contactObj.phone || req.body.phone || '+91 98260 00000',
        email: contactObj.email || req.body.email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.org`,
        emergencyContact: contactObj.emergencyContact || contactObj.phone || req.body.phone || '+91 98260 00000',
      };

      const hospital = await hospitalService.createHospital({
        name,
        hospitalCode,
        address,
        city: city || 'Indore',
        coordinates,
        contact: safeContact,
        role: role || 'BOTH',
        adminName,
        adminEmail,
        adminPassword,
      });
      return sendSuccess(res, 'Hospital and admin account created successfully', hospital, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const hospital = await hospitalService.updateHospital(req.params.id, req.body);
      return sendSuccess(res, 'Hospital updated successfully', hospital);
    } catch (error) {
      next(error);
    }
  }

  async updateVerification(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return sendError(res, 'Status is required', 'VALIDATION_ERROR', 400);
      }

      const hospital = await hospitalService.updateVerificationStatus(req.params.id, status);
      return sendSuccess(res, `Hospital verification status updated to ${status}`, hospital);
    } catch (error) {
      next(error);
    }
  }

  async getNearby(req, res, next) {
    try {
      const hospitalId = req.params.id || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!hospitalId) {
        return sendError(res, 'Hospital ID required', 'VALIDATION_ERROR', 400);
      }

      const nearby = await hospitalService.getNearbyHospitals(hospitalId);
      return sendSuccess(res, 'Nearby hospitals retrieved', nearby);
    } catch (error) {
      next(error);
    }
  }
}

export const hospitalController = new HospitalController();
