import { BloodInventory } from '../models/BloodInventory.js';

export class InventoryRepository {
  async findAll(filter = {}) {
    return BloodInventory.find(filter).populate('hospitalId', 'name hospitalCode city').sort({ updatedAt: -1 });
  }

  async findById(id) {
    return BloodInventory.findById(id).populate('hospitalId');
  }

  async findByHospitalAndComponent(hospitalId, bloodGroup, component) {
    return BloodInventory.findOne({ hospitalId, bloodGroup, component });
  }

  async findByHospital(hospitalId) {
    return BloodInventory.find({ hospitalId }).sort({ bloodGroup: 1, component: 1 });
  }

  async findMatchingInventory(bloodGroup, component, minUnits = 1) {
    return BloodInventory.find({
      bloodGroup,
      component,
      units: { $gte: minUnits },
      expiryDate: { $gt: new Date() },
    }).populate('hospitalId');
  }

  async create(data) {
    return BloodInventory.create(data);
  }

  async update(id, updateData) {
    return BloodInventory.findByIdAndUpdate(id, { ...updateData, lastUpdated: new Date() }, { new: true, runValidators: true });
  }

  async delete(id) {
    return BloodInventory.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return BloodInventory.countDocuments(filter);
  }

  async getTotalUnitsByHospital(hospitalId) {
    const result = await BloodInventory.aggregate([
      { $match: { hospitalId } },
      { $group: { _id: null, totalUnits: { $sum: '$units' }, totalReserved: { $sum: '$reservedUnits' } } },
    ]);
    return result[0] || { totalUnits: 0, totalReserved: 0 };
  }
}

export const inventoryRepository = new InventoryRepository();
