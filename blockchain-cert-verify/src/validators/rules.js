const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const VALID_ROLES = ['student', 'university_staff'];

const required = (message = 'This field is required') => (value) => {
  if (value === undefined || value === null || value === '') return message;
  return null;
};

const isEmail = (value) => {
  if (value && !EMAIL_REGEX.test(value)) return 'Must be a valid email address';
  return null;
};

const minLength = (min) => (value) => {
  if (value && String(value).length < min) return `Must be at least ${min} characters`;
  return null;
};

const isIn = (allowed, message) => (value) => {
  if (value && !allowed.includes(value)) return message || `Must be one of: ${allowed.join(', ')}`;
  return null;
};

const isPositiveInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return 'Must be a positive integer';
  return null;
};

const isWalletAddress = (value) => {
  if (value && !WALLET_REGEX.test(value)) return 'Must be a valid Ethereum wallet address';
  return null;
};

const optionalString = () => () => null;

const parseId = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return next(new AppError(`Invalid ${paramName}`, 400));
  }
  req.params[paramName] = num;
  next();
};

module.exports = {
  required,
  isEmail,
  minLength,
  isIn,
  isPositiveInt,
  isWalletAddress,
  optionalString,
  parseId,
  VALID_ROLES
};
