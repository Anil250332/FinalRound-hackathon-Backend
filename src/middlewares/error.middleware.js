import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[PulseRelay Error] ${err.stack || err.message}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 400, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `Duplicate field value for: ${field}`, 'DUPLICATE_KEY', 409);
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, `Invalid ID format for ${err.path}`, 'INVALID_ID', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'SERVER_ERROR';

  return sendError(res, message, code, statusCode);
};
