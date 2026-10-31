import { Reservation } from '../models/Reservation.js';

export class ReservationRepository {
  async findAll(filter = {}) {
    return Reservation.find(filter)
      .populate('requestId')
      .populate('offerId')
      .populate('hospitalId')
      .populate('bloodInventoryId')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return Reservation.findById(id)
      .populate('requestId')
      .populate('offerId')
      .populate('hospitalId')
      .populate('bloodInventoryId');
  }

  async findByOfferId(offerId) {
    return Reservation.findOne({ offerId });
  }

  async findByHospital(hospitalId) {
    return Reservation.find({ hospitalId })
      .populate('requestId')
      .populate('offerId')
      .sort({ createdAt: -1 });
  }

  async create(data) {
    return Reservation.create(data);
  }

  async update(id, updateData) {
    return Reservation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async delete(id) {
    return Reservation.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return Reservation.countDocuments(filter);
  }
}

export const reservationRepository = new ReservationRepository();
