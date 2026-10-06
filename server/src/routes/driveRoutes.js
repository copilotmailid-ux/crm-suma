const express = require('express');
const router = express.Router();
const {
  getDrives,
  getDrive,
  createDrive,
  updateDrive,
  deleteDrive,
  applyForDrive,
} = require('../controllers/driveController');
const authMiddleware = require('../middleware/authMiddleware');
const studentAuthMiddleware = require('../middleware/studentAuthMiddleware');

// Public/Authenticated reads
router.get('/', getDrives);
router.get('/:id', getDrive);

// Admin drive management
router.post('/', authMiddleware, createDrive);
router.put('/:id', authMiddleware, updateDrive);
router.delete('/:id', authMiddleware, deleteDrive);

// Student registration/application
router.post('/:id/apply', studentAuthMiddleware, applyForDrive);

module.exports = router;
