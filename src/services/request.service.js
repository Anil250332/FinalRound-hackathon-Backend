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

  async fulfillRequest(id, fulfillingHospitalId, fulfillingHospitalName, user) {
    const request = await requestRepository.findById(id);
    if (!request) {
      throw new Error('Emergency request not found');
    }

    if (['FULLY_ALLOCATED', 'HANDOVER_COMPLETED'].includes(request.status)) {
      throw new Error('This request has already been fulfilled');
    }

    const fulfillingHospital = await hospitalRepository.findById(fulfillingHospitalId);
    const resolvedName = fulfillingHospitalName || (fulfillingHospital ? fulfillingHospital.name : 'Regional Hospital');

    const updated = await requestRepository.update(id, {
      status: 'FULLY_ALLOCATED',
      allocatedUnits: request.requiredUnits,
      acceptedByHospitalId: fulfillingHospitalId,
      acceptedByHospitalName: resolvedName,
      acceptedAt: new Date(),
    });

    // Notify the requesting hospital
    if (request.requestingHospitalId) {
      const recipientId = request.requestingHospitalId._id || request.requestingHospitalId;
      await notificationRepository.create({
        recipientHospitalId: recipientId,
        title: `Requirement Accepted by ${resolvedName}`,
        message: `${resolvedName} has accepted your emergency requirement for ${request.requiredUnits} Units ${request.bloodGroup} ${request.component}.`,
        type: 'OFFER_ACCEPTED',
        referenceId: request._id.toString(),
      });
    }

    // Broadcast socket event
    broadcastEmergency('request:fulfilled', {
      id: request._id,
      requestId: request.requestId,
      acceptedByHospitalName: resolvedName,
      status: 'FULLY_ALLOCATED',
    });

    // Audit log
    await auditRepository.create({
      userId: user ? user._id : null,
      hospitalId: fulfillingHospitalId,
      action: 'ACCEPT_AND_FULFILL_REQUEST',
      details: { requestId: request.requestId, acceptedBy: resolvedName },
    });

    return updated;
  }
}

export const requestService = new RequestService();
