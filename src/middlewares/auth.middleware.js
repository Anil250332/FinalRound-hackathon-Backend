import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { sendError } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token missing or invalid', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      return sendError(res, 'User account not found or suspended', 'UNAUTHORIZED', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired', 'TOKEN_EXPIRED', 401);
    }
    return sendError(res, 'Invalid authentication token', 'UNAUTHORIZED', 401);
  }
};
