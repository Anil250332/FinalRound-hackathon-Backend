import { inventoryService } from '../services/inventory.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class InventoryController {
  async getByHospital(req, res, next) {
    try {
      const hospitalId = req.params.hospitalId || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!hospitalId) {
        return sendError(res, 'Hospital ID required', 'VALIDATION_ERROR', 400);
      }

      const inventory = await inventoryService.getHospitalInventory(hospitalId);
      return sendSuccess(res, 'Hospital inventory retrieved', inventory);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const hospitalId = req.params.hospitalId || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!hospitalId) {
        return sendError(res, 'Hospital ID required', 'VALIDATION_ERROR', 400);
      }

      const summary = await inventoryService.getInventorySummary(hospitalId);
      return sendSuccess(res, 'Inventory summary retrieved', summary);
    } catch (error) {
      next(error);
    }
  }

  async addOrUpdate(req, res, next) {
    try {
      const hospitalId = req.body.hospitalId || (req.user && req.user.hospitalId ? req.user.hospitalId._id : null);
      if (!hospitalId) {
        return sendError(res, 'Hospital ID required', 'VALIDATION_ERROR', 400);
      }

      const { bloodGroup, component, units, expiryDate, batchNumber } = req.body;
      if (!bloodGroup || !component || units === undefined || !expiryDate) {
        return sendError(res, 'bloodGroup, component, units, and expiryDate are required', 'VALIDATION_ERROR', 400);
      }

      const item = await inventoryService.addOrUpdateInventory(
        hospitalId,
        { bloodGroup, component, units, expiryDate, batchNumber },
        req.user
      );

      return sendSuccess(res, 'Inventory updated successfully', item, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUnits(req, res, next) {
    try {
      const { id } = req.params;
      const { units, reason } = req.body;
      const hospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : null;

      if (units === undefined) {
        return sendError(res, 'Units count is required', 'VALIDATION_ERROR', 400);
      }

      const updated = await inventoryService.updateUnits(hospitalId, id, units, reason, req.user);
      return sendSuccess(res, 'Units updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const hospitalId = req.user && req.user.hospitalId ? req.user.hospitalId._id : null;

      await inventoryService.deleteInventory(hospitalId, id);
      return sendSuccess(res, 'Inventory item deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
