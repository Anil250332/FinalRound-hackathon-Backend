import { transferRepository } from '../repositories/transfer.repository.js';
import { requestRepository } from '../repositories/request.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { generateOTP } from '../utils/otp.js';
import { emitToHospital } from '../sockets/socket.js';

export class TransferService {
  async createTransfer(data) {
    const otp = generateOTP();

    return transferRepository.create({
      requestId: data.requestId,
      offerId: data.offerId,
      requestingHospitalId: data.requestingHospitalId,
      supplyingHospitalId: data.supplyingHospitalId,
      units: data.units,
      dispatchStatus: 'PENDING',
      handoverStatus: 'PENDING',
      otp,
      otpAttempts: 0,
    });
  }

  async initiateDispatch(transferId, supplyingHospitalId, dispatchData = {}, user) {
    const transfer = await transferRepository.findById(transferId);
    if (!transfer) {
      throw new Error('Transfer record not found');
    }

    if (transfer.supplyingHospitalId._id.toString() !== supplyingHospitalId.toString()) {
      throw new Error('Only the supplying hospital can initiate dispatch');
    }

    if (transfer.dispatchStatus !== 'PENDING') {
      throw new Error(`Dispatch already in status ${transfer.dispatchStatus}`);
    }

    const updated = await transferRepository.update(transferId, {
      dispatchStatus: 'DISPATCH_INITIATED',
      dispatchedAt: new Date(),
      driverContact: dispatchData.driverContact || '',
      vehicleNumber: dispatchData.vehicleNumber || '',
    });

    // Update request status to DISPATCH_INITIATED
    await requestRepository.update(transfer.requestId._id, {
      status: 'DISPATCH_INITIATED',
    });

    // Notify receiving hospital
    await notificationRepository.create({
      recipientHospitalId: transfer.requestingHospitalId._id,
      title: '🚚 Blood Units Dispatched!',
      message: `${transfer.supplyingHospitalId.name} has dispatched ${transfer.units} units. Have your demo OTP ready for handover verification.`,
      type: 'DISPATCH_UPDATE',
      referenceId: transfer._id.toString(),
    });

    emitToHospital(transfer.requestingHospitalId._id, 'transfer:dispatched', {
      transferId: transfer._id,
      status: 'DISPATCH_INITIATED',
    });

    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId: supplyingHospitalId,
      action: 'INITIATE_DISPATCH',
      details: { transferId, units: transfer.units },
    });

    return updated;
  }

  async verifyHandoverOTP(transferId, requestingHospitalId, enteredOtp, user) {
    const transfer = await transferRepository.findById(transferId);
    if (!transfer) {
      throw new Error('Transfer record not found');
    }

    if (transfer.requestingHospitalId._id.toString() !== requestingHospitalId.toString()) {
      throw new Error('Only the receiving hospital can verify handover OTP');
    }

    if (transfer.handoverStatus === 'VERIFIED') {
      throw new Error('Transfer handover has already been verified and completed');
    }

    if (transfer.otpAttempts >= 5) {
      throw new Error('Maximum OTP verification attempts exceeded. Please contact supervisor.');
    }

    if (transfer.otp.trim() !== enteredOtp.toString().trim()) {
      await transferRepository.update(transferId, {
        otpAttempts: transfer.otpAttempts + 1,
      });
      throw new Error(`Invalid OTP. Attempt ${transfer.otpAttempts + 1} of 5.`);
    }

    // 1. Mark transfer as VERIFIED & DELIVERED
    const completedTransfer = await transferRepository.update(transferId, {
      handoverStatus: 'VERIFIED',
      dispatchStatus: 'DELIVERED',
      completedAt: new Date(),
    });

    // 2. Complete reservation
    const reservation = await reservationRepository.findByOfferId(transfer.offerId._id);
    if (reservation) {
      await reservationRepository.update(reservation._id, { status: 'CONFIRMED_DISPATCHED' });
    }

    // 3. Deduct stock from supplying hospital
    const request = await requestRepository.findById(transfer.requestId._id);
    const supplyingInventory = await inventoryRepository.findByHospitalAndComponent(
      transfer.supplyingHospitalId._id,
      request.bloodGroup,
      request.component
    );

    if (supplyingInventory) {
      const prevUnits = supplyingInventory.units;
      const prevReserved = supplyingInventory.reservedUnits;
      const newUnits = Math.max(0, prevUnits - transfer.units);
      const newReserved = Math.max(0, prevReserved - transfer.units);

      await inventoryRepository.update(supplyingInventory._id, {
        units: newUnits,
        reservedUnits: newReserved,
        availabilityStatus: newUnits > 2 ? 'AVAILABLE' : newUnits > 0 ? 'LOW_STOCK' : 'UNAVAILABLE',
      });

      // Record transaction
      await transactionRepository.create({
        hospitalId: transfer.supplyingHospitalId._id,
        bloodInventoryId: supplyingInventory._id,
        type: 'DISPATCH_TRANSFER',
        units: transfer.units,
        previousUnits: prevUnits,
        newUnits,
        reason: `Completed transfer to ${transfer.requestingHospitalId.name} for Request #${request.requestId}`,
        referenceId: transfer._id.toString(),
        performedBy: user ? user._id : null,
      });
    }

    // 4. Update Emergency Request status if fully completed
    const allTransfersForRequest = await transferRepository.findByRequestId(request._id);
    const totalDelivered = allTransfersForRequest.reduce((sum, t) => {
      return t.handoverStatus === 'VERIFIED' ? sum + t.units : sum;
    }, 0);

    if (totalDelivered >= request.requiredUnits) {
      await requestRepository.update(request._id, { status: 'HANDOVER_COMPLETED' });
    }

    // 5. Notify both parties
    await notificationRepository.create({
      recipientHospitalId: transfer.supplyingHospitalId._id,
      title: '🎉 Handover Verified & Completed',
      message: `${transfer.requestingHospitalId.name} verified OTP. ${transfer.units} units successfully handed over.`,
      type: 'TRANSFER_COMPLETED',
      referenceId: transfer._id.toString(),
    });

    await notificationRepository.create({
      recipientHospitalId: transfer.requestingHospitalId._id,
      title: '✅ Blood Units Received & Verified',
      message: `${transfer.units} units of ${request.bloodGroup} ${request.component} received from ${transfer.supplyingHospitalId.name}.`,
      type: 'TRANSFER_COMPLETED',
      referenceId: transfer._id.toString(),
    });

    emitToHospital(transfer.supplyingHospitalId._id, 'transfer:completed', {
      transferId: transfer._id,
      requestId: request.requestId,
      status: 'HANDOVER_COMPLETED',
    });

    emitToHospital(transfer.requestingHospitalId._id, 'transfer:completed', {
      transferId: transfer._id,
      requestId: request.requestId,
      status: 'HANDOVER_COMPLETED',
    });

    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId: requestingHospitalId,
      action: 'VERIFY_HANDOVER_OTP',
      details: { transferId, units: transfer.units },
    });

    return completedTransfer;
  }

  async getTransferById(id) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) {
      throw new Error('Transfer record not found');
    }
    return transfer;
  }

  async getHospitalTransfers(hospitalId) {
    return transferRepository.findByHospital(hospitalId);
  }
}

export const transferService = new TransferService();
