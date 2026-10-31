import { requestRepository } from '../repositories/request.repository.js';
import { hospitalRepository } from '../repositories/hospital.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { calculateDistance } from '../utils/distance.js';
import { broadcastEmergency } from '../sockets/socket.js';

export class RequestService {
  generateRequestId() {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PR-REQ-${random}`;
  }

  async createEmergencyRequest(hospitalId, data, user) {
    const hospital = await hospitalRepository.findById(hospitalId);
    if (!hospital) {
      throw new Error('Requesting hospital not found');
    }

    const requestId = this.generateRequestId();

    const request = await requestRepository.create({
      requestId,
      requestingHospitalId: hospitalId,
      bloodGroup: data.bloodGroup,
      component: data.component,
      requiredUnits: Number(data.requiredUnits),
      allocatedUnits: 0,
      urgency: data.urgency || 'HIGH',
      requiredBy: data.requiredBy || new Date(Date.now() + 2 * 60 * 60 * 1000), // Default 2 hours
      location: {
        city: hospital.city || 'Indore',
        coordinates: hospital.coordinates,
      },
      additionalNotes: data.additionalNotes || '',
      status: 'SEARCHING',
      createdBy: user ? user._id : null,
    });

    // Find matching hospitals to notify
    const matchingHospitals = await this.findMatchingHospitals(request);

    // Create notifications for matching hospitals
    for (const match of matchingHospitals) {
      await notificationRepository.create({
        recipientHospitalId: match.hospital._id,
        title: `🚨 Emergency Request: ${request.bloodGroup} ${request.component}`,
        message: `${hospital.name} requires ${request.requiredUnits} units of ${request.bloodGroup} ${request.component} urgently. Available matching distance: ${match.distanceKm} km.`,
        type: 'EMERGENCY_REQUEST',
        referenceId: request._id.toString(),
      });
    }

    // Broadcast socket event
    broadcastEmergency('emergency:broadcast', {
      requestId: request.requestId,
      id: request._id,
      hospitalName: hospital.name,
      bloodGroup: request.bloodGroup,
      component: request.component,
      requiredUnits: request.requiredUnits,
      urgency: request.urgency,
      matchingCount: matchingHospitals.length,
    });

    // Audit log
    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId,
      action: 'BROADCAST_EMERGENCY_REQUEST',
      details: { requestId, bloodGroup: data.bloodGroup, units: data.requiredUnits },
    });

    return {
      request,
      matchingHospitals,
    };
  }

  async findMatchingHospitals(request) {
    const sourceHospitalId = request.requestingHospitalId?._id || request.requestingHospitalId;
    const sourceHospital = await hospitalRepository.findById(sourceHospitalId);
    if (!sourceHospital) {
      throw new Error('Source hospital not found');
    }

    const bloodGroup = request.bloodGroup;
    const component = request.component;
    const requiredUnits = request.requiredUnits;

    // Find all verified hospitals other than source
    const otherHospitals = await hospitalRepository.findVerifiedHospitals(sourceHospital._id);

    const matches = [];

    for (const hosp of otherHospitals) {
      const inventory = await inventoryRepository.findByHospitalAndComponent(
        hosp._id,
        bloodGroup,
        component
      );

      const availableUnits = inventory ? Math.max(0, inventory.units - inventory.reservedUnits) : 0;
      const isExpired = inventory ? new Date(inventory.expiryDate) <= new Date() : true;

      const distance = calculateDistance(
        sourceHospital.coordinates.lat,
        sourceHospital.coordinates.lng,
        hosp.coordinates.lat,
        hosp.coordinates.lng
      );

      matches.push({
        hospital: {
          _id: hosp._id,
          name: hosp.name,
          hospitalCode: hosp.hospitalCode,
          city: hosp.city,
          contact: hosp.contact,
          coordinates: hosp.coordinates,
          verificationStatus: hosp.verificationStatus,
        },
        inventoryId: inventory ? inventory._id : null,
        availableUnits,
        totalUnits: inventory ? inventory.units : 0,
        reservedUnits: inventory ? inventory.reservedUnits : 0,
        isExpired,
        hasMatch: availableUnits > 0 && !isExpired,
        isSufficient: availableUnits >= requiredUnits,
        distanceKm: distance,
        lastUpdated: inventory ? inventory.lastUpdated : null,
      });
    }

    // Sort: 1. Available quantity > 0 first, 2. Closest distance
    return matches.sort((a, b) => {
      if (b.availableUnits !== a.availableUnits) {
        return b.availableUnits - a.availableUnits;
      }
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    });
  }

  async getAllRequests(filter = {}) {
    return requestRepository.findAll(filter);
  }

  async getRequestById(id) {
    const request = await requestRepository.findById(id);
    if (!request) {
      throw new Error('Emergency request not found');
    }
    return request;
  }

  async cancelRequest(id, hospitalId, user) {
    const request = await requestRepository.findById(id);
    if (!request) {
      throw new Error('Emergency request not found');
    }

    if (request.requestingHospitalId._id.toString() !== hospitalId.toString()) {
      throw new Error('Only the requesting hospital can cancel this request');
    }

    if (['DISPATCH_INITIATED', 'HANDOVER_COMPLETED'].includes(request.status)) {
      throw new Error('Cannot cancel request once dispatch or handover has started');
    }

    const updated = await requestRepository.update(id, { status: 'CANCELLED' });

    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId,
      action: 'CANCEL_EMERGENCY_REQUEST',
      details: { requestId: request.requestId },
    });

    return updated;
  }

  async acceptEmergencyRequest(id, acceptingHospitalId, user) {
    const request = await requestRepository.findById(id);
    if (!request) {
      throw new Error('Emergency request not found');
    }

    if (request.status === 'ACCEPTED') {
      throw new Error('This request has already been accepted by another hospital');
    }

    if (request.status === 'CANCELLED') {
      throw new Error('This request has been cancelled');
    }

    const sourceHospitalId = request.requestingHospitalId?._id || request.requestingHospitalId;
    if (sourceHospitalId.toString() === acceptingHospitalId.toString()) {
      throw new Error('A hospital cannot accept its own emergency request');
    }

    const acceptingHospital = await hospitalRepository.findById(acceptingHospitalId);
    if (!acceptingHospital) {
      throw new Error('Accepting hospital not found');
    }

    const updated = await requestRepository.update(id, {
      status: 'ACCEPTED',
      acceptedByHospitalId: acceptingHospitalId,
      acceptedByUserId: user ? user._id : null,
      acceptedAt: new Date(),
    });

    // Notify requesting hospital
    await notificationRepository.create({
      recipientHospitalId: sourceHospitalId,
      title: `✅ Emergency Request ACCEPTED: ${request.bloodGroup} ${request.component}`,
      message: `${acceptingHospital.name} has accepted your emergency request! Contact: ${acceptingHospital.contact?.phone || 'N/A'}, Email: ${acceptingHospital.contact?.email || 'N/A'}. Coordinate directly for fulfillment.`,
      type: 'OFFER_ACCEPTED',
      referenceId: request._id.toString(),
    });

    // Broadcast socket update
    broadcastEmergency('emergency:accepted', {
      requestId: request.requestId,
      id: request._id,
      requestingHospitalName: request.requestingHospitalId?.name,
      acceptedByHospitalName: acceptingHospital.name,
      acceptedByContact: acceptingHospital.contact,
      bloodGroup: request.bloodGroup,
      component: request.component,
      requiredUnits: request.requiredUnits,
    });

    // Audit log
    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId: acceptingHospitalId,
      action: 'ACCEPT_EMERGENCY_REQUEST',
      details: { requestId: request.requestId, acceptedBy: acceptingHospital.name },
    });

    return updated;
  }
}

export const requestService = new RequestService();
