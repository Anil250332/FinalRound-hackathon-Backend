import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      index: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'EMERGENCY_REQUEST',
        'OFFER_RECEIVED',
        'OFFER_ACCEPTED',
        'DISPATCH_UPDATE',
        'TRANSFER_COMPLETED',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    referenceId: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
