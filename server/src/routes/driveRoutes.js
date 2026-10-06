const express = require('express');
const router = express.Router();
const {
  getDrives,
  getDrive,
  getDriveCandidates,
  createDrive,
  updateDrive,
  deleteDrive,
  applyForDrive,
  advanceRoundCandidates,
  selectFinalCandidates,
  addOrUpdateRound,
  sendCustomRoundEmail,
} = require('../controllers/driveController');
const authMiddleware = require('../middleware/authMiddleware');
const studentAuthMiddleware = require('../middleware/studentAuthMiddleware');

// Public/Authenticated reads
router.get('/', getDrives);
router.get('/:id', getDrive);
router.get('/:id/candidates', authMiddleware, getDriveCandidates);

// Admin drive management
router.post('/', authMiddleware, createDrive);
router.put('/:id', authMiddleware, updateDrive);
router.delete('/:id', authMiddleware, deleteDrive);

// Multi-round progression & selection endpoints (Admin)
router.post('/:id/rounds', authMiddleware, addOrUpdateRound);
router.post('/:id/rounds/:roundNumber/advance', authMiddleware, advanceRoundCandidates);
router.post('/:id/rounds/:roundNumber/send-email', authMiddleware, sendCustomRoundEmail);
router.post('/:id/select-final', authMiddleware, selectFinalCandidates);

// Student registration/application
router.post('/:id/apply', studentAuthMiddleware, applyForDrive);

module.exports = router;
