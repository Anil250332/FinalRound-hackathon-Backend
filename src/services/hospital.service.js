import bcrypt from 'bcryptjs';
import { hospitalRepository } from '../repositories/hospital.repository.js';
import { userRepository } from '../repositories/user.repository.js';
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

    // 1. Create Hospital
    const contact = {
      phone: data.contact?.phone || data.phone || '+91 98260 00000',
      email: data.contact?.email || data.email || `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.org`,
      emergencyContact: data.contact?.emergencyContact || data.contact?.phone || data.phone || '+91 98260 00000',
    };

    const hospital = await hospitalRepository.create({
      name: data.name,
      hospitalCode: data.hospitalCode,
      address: data.address,
      city: data.city || 'Indore',
      coordinates: data.coordinates,
      contact,
      role: data.role || 'BOTH',
      verificationStatus: data.verificationStatus || 'VERIFIED',
    });

    // 2. Automatically create the Hospital Admin user account
    const adminEmail = (data.adminEmail || data.contact?.email || '').toLowerCase().trim();
    const adminPassword = data.adminPassword || 'Password@123';
    let adminUser = null;

    if (adminEmail) {
      const existingUser = await userRepository.findByEmail(adminEmail);
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        adminUser = await userRepository.create({
          name: data.adminName || `${hospital.name} Head`,
          email: adminEmail,
          password: hashedPassword,
          role: 'HOSPITAL_ADMIN',
          hospitalId: hospital._id,
          phone: data.contact?.phone || '',
          isActive: true,
        });
      }
    }

    const hospitalObj = hospital.toObject ? hospital.toObject() : hospital;
    return {
      ...hospitalObj,
      adminEmail,
      adminCreated: Boolean(adminUser),
    };
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
