import { Hospital } from '../models/Hospital.js';

export class HospitalRepository {
  async findAll(filter = {}) {
    return Hospital.find(filter).sort({ createdAt: -1 });
  }

  async findById(id) {
    return Hospital.findById(id);
  }

  async findByCode(hospitalCode) {
    return Hospital.findOne({ hospitalCode });
  }

  async findVerifiedHospitals(excludeId = null) {
    const filter = { verificationStatus: 'VERIFIED', isActive: true };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return Hospital.find(filter);
  }

  async create(data) {
    return Hospital.create(data);
  }

  async update(id, updateData) {
    return Hospital.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async delete(id) {
    return Hospital.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Hospital.countDocuments(filter);
  }
}

export const hospitalRepository = new HospitalRepository();
