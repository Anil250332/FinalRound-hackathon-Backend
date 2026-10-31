import { InventoryTransaction } from '../models/InventoryTransaction.js';

export class TransactionRepository {
  async findAll(filter = {}, limit = 100) {
    return InventoryTransaction.find(filter)
      .populate('hospitalId', 'name hospitalCode')
      .populate('bloodInventoryId')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findByHospital(hospitalId, limit = 50) {
    return InventoryTransaction.find({ hospitalId })
      .populate('bloodInventoryId')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async create(data) {
    return InventoryTransaction.create(data);
  }

  async count(filter = {}) {
    return InventoryTransaction.countDocuments(filter);
  }
}

export const transactionRepository = new TransactionRepository();
