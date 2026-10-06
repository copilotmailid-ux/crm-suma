const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const studentAuthMiddleware = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, please login' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find student
    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(401).json({ message: 'Student account not found' });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid token, please log in again' });
  }
};

module.exports = studentAuthMiddleware;
