import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
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
    requestingHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    supplyingHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    units: {
      type: Number,
      required: true,
      min: 1,
    },
    dispatchStatus: {
      type: String,
      enum: [
        'PENDING',
        'DISPATCH_INITIATED',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    handoverStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FAILED'],
      default: 'PENDING',
    },
    otp: {
      type: String,
      required: true,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    driverContact: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    dispatchedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Transfer = mongoose.model('Transfer', transferSchema);
