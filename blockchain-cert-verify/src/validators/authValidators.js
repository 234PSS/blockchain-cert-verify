const { required, isEmail, minLength, isIn, isWalletAddress, VALID_ROLES } = require('./rules');

const registerSchema = {
  body: {
    name: [required('Name is required'), minLength(2)],
    email: [required('Email is required'), isEmail],
    password: [required('Password is required'), minLength(8)],
    role: [required('Role is required'), isIn(VALID_ROLES, 'Role must be student or university_staff')],
    walletAddress: [isWalletAddress]
  }
};

const loginSchema = {
  body: {
    email: [required('Email is required'), isEmail],
    password: [required('Password is required')]
  }
};

module.exports = { registerSchema, loginSchema };
