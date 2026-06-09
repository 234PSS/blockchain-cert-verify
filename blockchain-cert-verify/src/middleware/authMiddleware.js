const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ['user_id', 'email', 'role', 'name']
    });

    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    req.user = {
      id: user.user_id,
      role: user.role,
      email: user.email,
      name: user.name
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Invalid or expired token', 401));
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Access denied', 403));
  }
  next();
};

module.exports = { authenticate, authorize };
