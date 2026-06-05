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
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password_hash'] }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, user });
};
