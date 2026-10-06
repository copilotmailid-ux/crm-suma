const express = require('express');
const router = express.Router();
const {
  studentLogin,
  getStudentProfile,
  updateStudentProfile,
  changeStudentPassword,
} = require('../controllers/studentAuthController');
const studentAuthMiddleware = require('../middleware/studentAuthMiddleware');

// Student Auth & Profile routes
router.post('/login', studentLogin);
router.get('/profile', studentAuthMiddleware, getStudentProfile);
router.put('/profile', studentAuthMiddleware, updateStudentProfile);
router.put('/change-password', studentAuthMiddleware, changeStudentPassword);

module.exports = router;
