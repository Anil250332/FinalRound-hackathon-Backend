import { Offer } from '../models/Offer.js';

export class OfferRepository {
  async findAll(filter = {}) {
    return Offer.find(filter)
      .populate('requestId')
      .populate('offeringHospitalId')
      .populate('offeredBy', 'name email role')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return Offer.findById(id)
      .populate('requestId')
      .populate('offeringHospitalId')
      .populate('offeredBy', 'name email role');
  }

  async findByRequestId(requestId) {
    return Offer.find({ requestId })
      .populate('offeringHospitalId')
      .populate('offeredBy', 'name email role')
      .sort({ createdAt: -1 });
  }

  async findByOfferingHospital(offeringHospitalId) {
    return Offer.find({ offeringHospitalId })
      .populate('requestId')
      .populate('offeringHospitalId')
      .sort({ createdAt: -1 });
  }

  async create(data) {
    return Offer.create(data);
  }

  async update(id, updateData) {
    return Offer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('requestId')
      .populate('offeringHospitalId');
  }

  async delete(id) {
    return Offer.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Offer.countDocuments(filter);
  }
}

export const offerRepository = new OfferRepository();
