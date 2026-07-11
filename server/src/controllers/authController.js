const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Login admin
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id).select('+password');

    if (!(await admin.comparePassword(currentPassword))) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
