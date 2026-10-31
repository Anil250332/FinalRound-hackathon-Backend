import mongoose from 'mongoose';

const bloodInventorySchema = new mongoose.Schema(
  {
    hospitalId: {
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
    units: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedUnits: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'LOW_STOCK', 'RESERVED', 'EXPIRED', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

bloodInventorySchema.index({ hospitalId: 1, bloodGroup: 1, component: 1 });

export const BloodInventory = mongoose.model('BloodInventory', bloodInventorySchema);
