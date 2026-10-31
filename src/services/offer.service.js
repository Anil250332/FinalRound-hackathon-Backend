import { offerRepository } from '../repositories/offer.repository.js';
import { requestRepository } from '../repositories/request.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { reservationRepository } from '../repositories/reservation.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { emitToHospital } from '../sockets/socket.js';
import { transferService } from './transfer.service.js';

export class OfferService {
  async createOffer(offeringHospitalId, data, user) {
    const { requestId, offeredUnits, notes } = data;

    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new Error('Emergency request not found');
    }

    if (['FULLY_ALLOCATED', 'DISPATCH_INITIATED', 'HANDOVER_COMPLETED', 'CANCELLED', 'EXPIRED'].includes(request.status)) {
      throw new Error(`Cannot submit offer for request with status ${request.status}`);
    }

    if (request.requestingHospitalId._id.toString() === offeringHospitalId.toString()) {
      throw new Error('A hospital cannot offer blood to its own request');
    }

    // Check inventory availability at offering hospital
    const inventory = await inventoryRepository.findByHospitalAndComponent(
      offeringHospitalId,
      request.bloodGroup,
      request.component
    );

    if (!inventory) {
      throw new Error(`Your hospital does not have ${request.bloodGroup} ${request.component} in inventory`);
    }

    const available = inventory.units - inventory.reservedUnits;
    if (available < Number(offeredUnits)) {
      throw new Error(`Insufficient unreserved units available. Currently available: ${available}`);
    }

    const offer = await offerRepository.create({
      requestId,
      offeringHospitalId,
      offeredUnits: Number(offeredUnits),
      offeredBy: user ? user._id : null,
      notes: notes || '',
      status: 'PENDING',
    });

    // Update request status to OFFERS_RECEIVED if it was SEARCHING
    if (request.status === 'SEARCHING') {
      await requestRepository.update(request._id, { status: 'OFFERS_RECEIVED' });
    }

    // Notify requesting hospital
    await notificationRepository.create({
      recipientHospitalId: request.requestingHospitalId._id,
      title: `🤝 New Offer Received for Request #${request.requestId}`,
      message: `An offer of ${offeredUnits} units of ${request.bloodGroup} ${request.component} was submitted.`,
      type: 'OFFER_RECEIVED',
      referenceId: request._id.toString(),
    });

    emitToHospital(request.requestingHospitalId._id, 'offer:received', {
      requestId: request.requestId,
      offerId: offer._id,
      offeredUnits,
    });

    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId: offeringHospitalId,
      action: 'SUBMIT_OFFER',
      details: { requestId: request.requestId, offeredUnits },
    });

    return offer;
  }

  async getOffersForRequest(requestId) {
    return offerRepository.findByRequestId(requestId);
  }

  async getHospitalOffers(hospitalId) {
    return offerRepository.findByOfferingHospital(hospitalId);
  }

  async acceptOffer(offerId, requestingHospitalId, user) {
    const offer = await offerRepository.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.status !== 'PENDING') {
      throw new Error(`Offer is already ${offer.status}`);
    }

    const request = await requestRepository.findById(offer.requestId._id);
    if (!request) {
      throw new Error('Emergency request not found');
    }

    if (request.requestingHospitalId._id.toString() !== requestingHospitalId.toString()) {
      throw new Error('Only the requesting hospital can accept this offer');
    }

    // Re-verify inventory at offering hospital
    const inventory = await inventoryRepository.findByHospitalAndComponent(
      offer.offeringHospitalId._id,
      request.bloodGroup,
      request.component
    );

    if (!inventory) {
      throw new Error('Offering hospital no longer has this blood component');
    }

    const available = inventory.units - inventory.reservedUnits;
    if (available < offer.offeredUnits) {
      throw new Error(`Offering hospital now only has ${available} unreserved units available`);
    }

    // 1. Reserve inventory
    const updatedReservedUnits = inventory.reservedUnits + offer.offeredUnits;
    await inventoryRepository.update(inventory._id, {
      reservedUnits: updatedReservedUnits,
      availabilityStatus: inventory.units === updatedReservedUnits ? 'RESERVED' : inventory.availabilityStatus,
    });

    // 2. Create Reservation document
    const reservation = await reservationRepository.create({
      requestId: request._id,
      offerId: offer._id,
      hospitalId: offer.offeringHospitalId._id,
      bloodInventoryId: inventory._id,
      reservedUnits: offer.offeredUnits,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // 3. Record Inventory Transaction
    await transactionRepository.create({
      hospitalId: offer.offeringHospitalId._id,
      bloodInventoryId: inventory._id,
      type: 'RESERVE',
      units: offer.offeredUnits,
      previousUnits: inventory.units,
      newUnits: inventory.units,
      reason: `Reserved for Request #${request.requestId}`,
      referenceId: request._id.toString(),
      performedBy: user ? user._id : null,
    });

    // 4. Update offer status to ACCEPTED
    const updatedOffer = await offerRepository.update(offerId, { status: 'ACCEPTED' });

    // 5. Update request allocated units & status
    const newAllocated = request.allocatedUnits + offer.offeredUnits;
    const isFullyAllocated = newAllocated >= request.requiredUnits;
    const newStatus = isFullyAllocated ? 'FULLY_ALLOCATED' : 'PARTIALLY_ALLOCATED';

    const updatedRequest = await requestRepository.update(request._id, {
      allocatedUnits: newAllocated,
      status: newStatus,
    });

    // 6. Create Transfer Record with 6-digit OTP
    const transfer = await transferService.createTransfer({
      requestId: request._id,
      offerId: offer._id,
      requestingHospitalId: request.requestingHospitalId._id,
      supplyingHospitalId: offer.offeringHospitalId._id,
      units: offer.offeredUnits,
    });

    // 7. Notify Offering Hospital
    await notificationRepository.create({
      recipientHospitalId: offer.offeringHospitalId._id,
      title: `✅ Offer Accepted for Request #${request.requestId}`,
      message: `${request.requestingHospitalId.name} accepted your offer of ${offer.offeredUnits} units. Transfer initialized with demo OTP.`,
      type: 'OFFER_ACCEPTED',
      referenceId: transfer._id.toString(),
    });

    emitToHospital(offer.offeringHospitalId._id, 'offer:accepted', {
      requestId: request.requestId,
      offerId: offer._id,
      transferId: transfer._id,
      otp: transfer.otp,
    });

    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId: requestingHospitalId,
      action: 'ACCEPT_OFFER',
      details: { requestId: request.requestId, offerId: offer._id, units: offer.offeredUnits },
    });

    return {
      offer: updatedOffer,
      request: updatedRequest,
      reservation,
      transfer,
    };
  }

  async rejectOffer(offerId, requestingHospitalId, user) {
    const offer = await offerRepository.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.requestId.requestingHospitalId.toString() !== requestingHospitalId.toString()) {
      throw new Error('Only requesting hospital can reject this offer');
    }

    const updated = await offerRepository.update(offerId, { status: 'REJECTED' });

    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId: requestingHospitalId,
      action: 'REJECT_OFFER',
      details: { offerId },
    });

    return updated;
  }
}

export const offerService = new OfferService();
