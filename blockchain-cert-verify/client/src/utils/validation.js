const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function validateRequired(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required`;
  }
  return null;
}

export function validateEmail(value) {
  const required = validateRequired(value, 'Email');
  if (required) return required;
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(value) {
  const required = validateRequired(value, 'Password');
  if (required) return required;
  if (String(value).length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function validateMinLength(value, min, label) {
  const required = validateRequired(value, label);
  if (required) return required;
  if (String(value).trim().length < min) {
    return `${label} must be at least ${min} characters`;
  }
  return null;
}

export function validatePositiveInt(value, label) {
  const required = validateRequired(value, label);
  if (required) return required;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return `${label} must be a positive number`;
  }
  return null;
}

export function validateWallet(value) {
  if (!value || String(value).trim() === '') return null;
  if (!WALLET_REGEX.test(value)) return 'Enter a valid Ethereum wallet address';
  return null;
}

export function validateFile(file, { maxMb = 5, label = 'Document' } = {}) {
  if (!file) return `${label} is required`;
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowed.includes(file.type)) {
    return 'File must be PDF, JPEG, or PNG';
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File must be smaller than ${maxMb} MB`;
  }
  return null;
}

export function collectErrors(validations) {
  return validations.reduce((errors, [field, message]) => {
    if (message) errors[field] = message;
    return errors;
  }, {});
}
