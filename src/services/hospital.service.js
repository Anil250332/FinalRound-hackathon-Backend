import { hospitalRepository } from '../repositories/hospital.repository.js';
import { calculateDistance } from '../utils/distance.js';

export class HospitalService {
  async getAllHospitals(filter = {}) {
    return hospitalRepository.findAll(filter);
  }

  async getHospitalById(id) {
    const hospital = await hospitalRepository.findById(id);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    return hospital;
  }

  async createHospital(data) {
    const existing = await hospitalRepository.findByCode(data.hospitalCode);
    if (existing) {
      throw new Error(`Hospital with code ${data.hospitalCode} already exists`);
    }
    return hospitalRepository.create(data);
  }

  async updateHospital(id, data) {
    const hospital = await hospitalRepository.findById(id);
    if (!hospital) {
      throw new Error('Hospital not found');
    }
    return hospitalRepository.update(id, data);
  }

  async updateVerificationStatus(id, status) {
    if (!['VERIFIED', 'PENDING', 'SUSPENDED'].includes(status)) {
      throw new Error('Invalid verification status');
    }
    return hospitalRepository.update(id, { verificationStatus: status });
  }

  async getNearbyHospitals(sourceHospitalId) {
    const sourceHospital = await hospitalRepository.findById(sourceHospitalId);
    if (!sourceHospital) {
      throw new Error('Source hospital not found');
    }

    const allVerified = await hospitalRepository.findVerifiedHospitals(sourceHospitalId);

    const withDistance = allVerified.map((h) => {
      const distance = calculateDistance(
        sourceHospital.coordinates.lat,
        sourceHospital.coordinates.lng,
        h.coordinates.lat,
        h.coordinates.lng
      );
      return {
        ...h.toObject(),
        distanceKm: distance,
      };
    });

    // Sort by closest distance
    return withDistance.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  }
}

export const hospitalService = new HospitalService();
