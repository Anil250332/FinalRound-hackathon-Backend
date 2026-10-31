import { userService } from '../services/user.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  async getAll(req, res, next) {
    try {
      const filter = {};
      if (req.query.hospitalId) {
        filter.hospitalId = req.query.hospitalId;
      }
      if (req.query.role) {
        filter.role = req.query.role;
      }
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }

      const users = await userService.getAllUsers(filter);
      return sendSuccess(res, 'Users retrieved successfully', users);
    } catch (error) {
      next(error);
    }
  }

  async getByHospital(req, res, next) {
    try {
      const hospitalId =
        req.params.hospitalId ||
        (req.user && req.user.hospitalId ? (req.user.hospitalId._id || req.user.hospitalId) : null);

      if (!hospitalId) {
        return sendError(res, 'Hospital ID is required', 'VALIDATION_ERROR', 400);
      }

      const users = await userService.getUsersByHospital(hospitalId);
      return sendSuccess(res, 'Hospital staff retrieved successfully', users);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return sendSuccess(res, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, email, password, role, hospitalId, phone, isActive } = req.body;

      if (!name || !email) {
        return sendError(res, 'Name and email are required', 'VALIDATION_ERROR', 400);
      }

      // If created by a hospital admin, default hospitalId to their hospital
      const effectiveHospitalId =
        hospitalId ||
        (req.user && req.user.hospitalId ? (req.user.hospitalId._id || req.user.hospitalId) : null);

      const user = await userService.createUser({
        name,
        email,
        password,
        role: role || 'BLOOD_BANK_OFFICER',
        hospitalId: effectiveHospitalId,
        phone,
        isActive,
      });

      return sendSuccess(res, 'User created successfully', user, 201);
    } catch (error) {
      return sendError(res, error.message, 'CREATE_USER_FAILED', 400);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await userService.updateUser(req.params.id, req.body);
      return sendSuccess(res, 'User updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      if (isActive === undefined) {
        return sendError(res, 'isActive boolean is required', 'VALIDATION_ERROR', 400);
      }

      const updated = await userService.toggleUserStatus(req.params.id, Boolean(isActive));
      return sendSuccess(res, `User ${isActive ? 'activated' : 'deactivated'} successfully`, updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      return sendSuccess(res, 'User deleted successfully', { id: req.params.id });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
