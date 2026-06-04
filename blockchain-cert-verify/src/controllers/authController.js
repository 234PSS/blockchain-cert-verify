const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Institution } = require('../models');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, walletAddress, studentNumber, enrollmentDate, department } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role,
      wallet_address: walletAddress
    });

    if (role === 'student' && studentNumber) {
      await Student.create({
        user_id: user.user_id,
        student_number: studentNumber,
        enrollment_date: enrollmentDate,
        department
      });
    }

    if (role === 'university_staff') {
      await Institution.create({
        name: `${name}'s Institution`,
        wallet_address: walletAddress,
        is_verified: false
      });
    }

    const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(201).json({
      success: true,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.json({
      success: true,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};