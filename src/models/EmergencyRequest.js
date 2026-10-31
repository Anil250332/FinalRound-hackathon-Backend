import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    requestingHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    component: {
      type: String,
      enum: ['Whole Blood', 'PRBC', 'Platelets', 'FFP', 'Cryoprecipitate'],
      required: true,
    },
    requiredUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    allocatedUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'NORMAL'],
      required: true,
      default: 'HIGH',
    },
    requiredBy: {
      type: Date,
    },
    location: {
      city: { type: String, default: 'Indore' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    additionalNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'SEARCHING',
        'ACCEPTED',
        'OFFERS_RECEIVED',
        'PARTIALLY_ALLOCATED',
        'FULLY_ALLOCATED',
        'DISPATCH_INITIATED',
        'HANDOVER_COMPLETED',
        'CANCELLED',
        'EXPIRED',
      ],
      default: 'SEARCHING',
      index: true,
    },
    acceptedByHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    acceptedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
