import { sendError } from '../utils/response.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
        'FORBIDDEN',
        403
      );
    }

    next();
  };
};

// Check that user belongs to the target hospital (or is Super Admin)
export const requireHospitalAccess = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 'UNAUTHORIZED', 401);
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const targetHospitalId = req.params.hospitalId || req.body.hospitalId || req.query.hospitalId;

  if (targetHospitalId && req.user.hospitalId && req.user.hospitalId._id.toString() !== targetHospitalId.toString()) {
    return sendError(res, 'Access denied: You do not belong to this hospital', 'FORBIDDEN', 403);
  }

  next();
};
