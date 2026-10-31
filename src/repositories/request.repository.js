import { EmergencyRequest } from '../models/EmergencyRequest.js';

export class RequestRepository {
  async findAll(filter = {}) {
    return EmergencyRequest.find(filter)
      .populate('requestingHospitalId')
      .populate('acceptedByHospitalId')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return EmergencyRequest.findById(id)
      .populate('requestingHospitalId')
      .populate('acceptedByHospitalId')
      .populate('createdBy', 'name email role');
  }

  async findByRequestId(requestId) {
    return EmergencyRequest.findOne({ requestId })
      .populate('requestingHospitalId')
      .populate('acceptedByHospitalId')
      .populate('createdBy', 'name email role');
  }

  async findActiveRequests(filter = {}) {
    return EmergencyRequest.find({
      status: { $in: ['SEARCHING', 'OFFERS_RECEIVED', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED', 'DISPATCH_INITIATED'] },
      ...filter,
    })
      .populate('requestingHospitalId')
      .populate('acceptedByHospitalId')
      .sort({ urgency: 1, createdAt: -1 });
  }

  async create(data) {
    return EmergencyRequest.create(data);
  }

  async update(id, updateData) {
    return EmergencyRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('requestingHospitalId')
      .populate('acceptedByHospitalId')
      .populate('createdBy', 'name email role');
  }

  async delete(id) {
    return EmergencyRequest.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return EmergencyRequest.countDocuments(filter);
  }
}

export const requestRepository = new RequestRepository();
