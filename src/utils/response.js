export const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'Internal Server Error', code = 'SERVER_ERROR', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    code,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};
