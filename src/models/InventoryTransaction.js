import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: [
        'ADD_STOCK',
        'DEDUCT_STOCK',
        'RESERVE',
        'RELEASE_RESERVATION',
        'DISPATCH_TRANSFER',
        'EXPIRED',
      ],
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    previousUnits: {
      type: Number,
    },
    newUnits: {
      type: Number,
    },
    reason: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const InventoryTransaction = mongoose.model(
  'InventoryTransaction',
  inventoryTransactionSchema
);
