const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Institution } = require('../models');

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