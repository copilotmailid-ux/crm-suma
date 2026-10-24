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
  eliminateRoundCandidates,
  updateCandidateRoundStatus,
  selectFinalCandidates,
  revertPlacedCandidates,
  addOrUpdateRound,
  sendCustomRoundEmail,
  resendRoundEmail,
  resendOfferEmail,
  getEmailConfig,
  saveEmailConfig,
  uploadDriveOfferLetter,
} = require('../controllers/driveController');
const authMiddleware = require('../middleware/authMiddleware');
const studentAuthMiddleware = require('../middleware/studentAuthMiddleware');

// Email configuration endpoints (Admin)
router.get('/email-config', authMiddleware, getEmailConfig);
router.post('/email-config', authMiddleware, saveEmailConfig);

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
router.post('/:id/rounds/:roundNumber/eliminate', authMiddleware, eliminateRoundCandidates);
router.post('/:id/rounds/:roundNumber/status', authMiddleware, updateCandidateRoundStatus);
router.post('/:id/rounds/:roundNumber/send-email', authMiddleware, sendCustomRoundEmail);
router.post('/:id/rounds/:roundNumber/resend-email', authMiddleware, resendRoundEmail);
router.post('/:id/select-final', authMiddleware, selectFinalCandidates);
router.post('/:id/revert-placed', authMiddleware, revertPlacedCandidates);
router.post('/:id/resend-offer-email', authMiddleware, resendOfferEmail);
router.post('/:id/offer-letter', authMiddleware, uploadDriveOfferLetter);

// Student registration/application
router.post('/:id/apply', studentAuthMiddleware, applyForDrive);

module.exports = router;
