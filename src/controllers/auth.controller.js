import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return sendError(res, 'Email and password are required', 'VALIDATION_ERROR', 400);
      }

      const result = await authService.login(email, password);
      return sendSuccess(res, 'Login successful', result);
    } catch (error) {
      return sendError(res, error.message, 'AUTH_FAILED', 401);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user._id);
      return sendSuccess(res, 'Profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  async createStaff(req, res, next) {
    try {
      const { name, email, password, role, phone } = req.body;
      if (!name || !email || !password || !role) {
        return sendError(res, 'Name, email, password, and role are required', 'VALIDATION_ERROR', 400);
      }

      const staff = await authService.createStaff(req.user, { name, email, password, role, phone });
      return sendSuccess(res, 'Staff member created successfully', staff, 201);
    } catch (error) {
      next(error);
    }
  }

  async getDemoUsers(req, res, next) {
    try {
      const users = await authService.getDemoUsers();
      return sendSuccess(res, 'Demo users retrieved', users);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
