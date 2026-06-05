const AppError = require('../utils/AppError');

const handleSequelizeError = (err) => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path || 'field';
    return new AppError(`${field} already exists`, 409);
  }
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return new AppError('Validation failed', 400, messages);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('Referenced record not found', 400);
  }
  return null;
};

const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const sequelizeError = handleSequelizeError(error);
    if (sequelizeError) {
      error = sequelizeError;
    } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error = new AppError('Invalid or expired token', 401);
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File exceeds maximum allowed size', 400);
    } else {
      error = new AppError(
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        500
      );
    }
  }

  if (process.env.NODE_ENV !== 'production' && error.statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors })
  });
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

module.exports = { errorHandler, notFoundHandler };
