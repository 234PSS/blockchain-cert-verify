const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { User, Student, Institution } = require('../models');

const signToken = (user) =>
  jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

const sanitizeUser = (user) => ({
  user_id: user.user_id,
  name: user.name,
  email: user.email,
  role: user.role
});

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, walletAddress, studentNumber, enrollmentDate, department } = req.body;
    
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin registration is restricted' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role: role || 'student',
      wallet_address: walletAddress
    });
  const { name, email, password, role, walletAddress, studentNumber, enrollmentDate, department } = req.body;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  if (role === 'student') {
    if (!studentNumber) throw new AppError('studentNumber is required for students', 400);
    if (!enrollmentDate) throw new AppError('enrollmentDate is required for students', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password_hash: hashedPassword,
    role,
    wallet_address: walletAddress || null
  });

  if (role === 'student') {
    await Student.create({
      user_id: user.user_id,
      student_number: studentNumber,
      enrollment_date: enrollmentDate,
      department: department || null
    });
  }

  if (role === 'university_staff') {
    await Institution.create({
      name: `${name}'s Institution`,
      wallet_address: walletAddress || null,
      is_verified: false
    });
  }

  const token = signToken(user);

  res.status(201).json({
    success: true,
    user: sanitizeUser(user),
    token
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = signToken(user);

  res.json({
    success: true,
    user: sanitizeUser(user),
    token
  });
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [Student]
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.listInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.findAll();
    res.json({ success: true, institutions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    const institution = await Institution.findByPk(id);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    await institution.update({
      is_verified: isVerified,
      verification_date: isVerified ? new Date() : null
    });

    const blockchainService = require('../services/blockchainService');
    const tx = await blockchainService.contract.authorizeUniversity(institution.wallet_address, isVerified);
    await tx.wait();

    res.json({ success: true, message: 'Institution verification status updated', transactionHash: tx.hash });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password_hash'] }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, user });
};
