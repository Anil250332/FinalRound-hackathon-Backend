import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hospitalCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      default: 'Indore',
      trim: true,
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      emergencyContact: { type: String, required: true },
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'SUSPENDED'],
      default: 'VERIFIED',
    },
    role: {
      type: String,
      enum: ['REQUESTING', 'PROVIDING', 'BOTH'],
      default: 'BOTH',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Hospital = mongoose.model('Hospital', hospitalSchema);
