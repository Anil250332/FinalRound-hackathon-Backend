import { inventoryRepository } from '../repositories/inventory.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';

export class InventoryService {
  async getHospitalInventory(hospitalId) {
    const inventory = await inventoryRepository.findByHospital(hospitalId);
    const now = new Date();

    // Dynamically mark status if expired
    return inventory.map((item) => {
      const isExpired = new Date(item.expiryDate) < now;
      let status = item.availabilityStatus;
      if (isExpired) {
        status = 'EXPIRED';
      } else if (item.units <= 2 && item.units > 0) {
        status = 'LOW_STOCK';
      } else if (item.units === 0) {
        status = 'UNAVAILABLE';
      }
      return {
        ...item.toObject(),
        availabilityStatus: status,
        isExpired,
      };
    });
  }

  async getInventorySummary(hospitalId) {
    const items = await this.getHospitalInventory(hospitalId);
    let totalUnits = 0;
    let totalReserved = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    items.forEach((item) => {
      totalUnits += item.units;
      totalReserved += item.reservedUnits;
      if (item.units > 0 && item.units <= 3) lowStockCount++;
      if (new Date(item.expiryDate) <= sevenDaysFromNow && new Date(item.expiryDate) >= new Date()) {
        expiringSoonCount++;
      }
    });

    return {
      totalUnits,
      totalReserved,
      availableUnits: Math.max(0, totalUnits - totalReserved),
      lowStockCount,
      expiringSoonCount,
      totalCategories: items.length,
    };
  }

  async addOrUpdateInventory(hospitalId, data, user) {
    const { bloodGroup, component, units, expiryDate, batchNumber } = data;

    let item = await inventoryRepository.findByHospitalAndComponent(hospitalId, bloodGroup, component);

    if (item) {
      const previousUnits = item.units;
      const updatedUnits = item.units + Number(units);

      item = await inventoryRepository.update(item._id, {
        units: updatedUnits,
        expiryDate: expiryDate || item.expiryDate,
        batchNumber: batchNumber || item.batchNumber,
        availabilityStatus: updatedUnits > 2 ? 'AVAILABLE' : 'LOW_STOCK',
      });

      await transactionRepository.create({
        hospitalId,
        bloodInventoryId: item._id,
        type: 'ADD_STOCK',
        units: Number(units),
        previousUnits,
        newUnits: updatedUnits,
        reason: 'Stock addition via dashboard',
        performedBy: user ? user._id : null,
      });

      return item;
    } else {
      item = await inventoryRepository.create({
        hospitalId,
        bloodGroup,
        component,
        units: Number(units),
        reservedUnits: 0,
        expiryDate,
        batchNumber,
        availabilityStatus: Number(units) > 2 ? 'AVAILABLE' : 'LOW_STOCK',
      });

      await transactionRepository.create({
        hospitalId,
        bloodInventoryId: item._id,
        type: 'ADD_STOCK',
        units: Number(units),
        previousUnits: 0,
        newUnits: Number(units),
        reason: 'Initial stock entry',
        performedBy: user ? user._id : null,
      });

      return item;
    }
  }

  async updateUnits(hospitalId, inventoryId, newUnits, reason = 'Manual inventory adjustment', user) {
    const item = await inventoryRepository.findById(inventoryId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    if (item.hospitalId._id.toString() !== hospitalId.toString()) {
      throw new Error('Unauthorized to modify this inventory');
    }

    const previousUnits = item.units;
    const unitsVal = Number(newUnits);

    if (unitsVal < item.reservedUnits) {
      throw new Error(`Cannot reduce units below currently reserved count (${item.reservedUnits})`);
    }

    const updated = await inventoryRepository.update(inventoryId, {
      units: unitsVal,
      availabilityStatus: unitsVal > 2 ? 'AVAILABLE' : unitsVal > 0 ? 'LOW_STOCK' : 'UNAVAILABLE',
    });

    await transactionRepository.create({
      hospitalId,
      bloodInventoryId: inventoryId,
      type: unitsVal >= previousUnits ? 'ADD_STOCK' : 'DEDUCT_STOCK',
      units: Math.abs(unitsVal - previousUnits),
      previousUnits,
      newUnits: unitsVal,
      reason,
      performedBy: user ? user._id : null,
    });

    return updated;
  }

  async deleteInventory(hospitalId, inventoryId) {
    const item = await inventoryRepository.findById(inventoryId);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    if (item.hospitalId._id.toString() !== hospitalId.toString()) {
      throw new Error('Unauthorized to delete this inventory');
    }

    if (item.reservedUnits > 0) {
      throw new Error('Cannot delete inventory with active reservations');
    }

    return inventoryRepository.delete(inventoryId);
  }
}

export const inventoryService = new InventoryService();
