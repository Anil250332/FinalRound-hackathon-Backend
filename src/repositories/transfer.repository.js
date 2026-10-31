import { Transfer } from '../models/Transfer.js';

export class TransferRepository {
  async findAll(filter = {}) {
    return Transfer.find(filter)
      .populate('requestId')
      .populate('offerId')
      .populate('requestingHospitalId')
      .populate('supplyingHospitalId')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return Transfer.findById(id)
      .populate('requestId')
      .populate('offerId')
      .populate('requestingHospitalId')
      .populate('supplyingHospitalId');
  }

  async findByRequestId(requestId) {
    return Transfer.find({ requestId })
      .populate('offerId')
      .populate('requestingHospitalId')
      .populate('supplyingHospitalId');
  }

  async findByHospital(hospitalId) {
    return Transfer.find({
      $or: [{ requestingHospitalId: hospitalId }, { supplyingHospitalId: hospitalId }],
    })
      .populate('requestId')
      .populate('offerId')
      .populate('requestingHospitalId')
      .populate('supplyingHospitalId')
      .sort({ createdAt: -1 });
  }

  async create(data) {
    return Transfer.create(data);
  }

  async update(id, updateData) {
    return Transfer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('requestId')
      .populate('offerId')
      .populate('requestingHospitalId')
      .populate('supplyingHospitalId');
  }

  async delete(id) {
    return Transfer.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Transfer.countDocuments(filter);
  }
}

export const transferRepository = new TransferRepository();
