import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyRequest',
      required: true,
      index: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    bloodInventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodInventory',
      required: true,
    },
    reservedUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CONFIRMED_DISPATCHED', 'RELEASED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Reservation = mongoose.model('Reservation', reservationSchema);
