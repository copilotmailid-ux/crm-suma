const express = require('express');
const router = express.Router();
const {
  getStats,
  getDeptWise,
  getCompanyWise,
  getBatchWise,
  getRecent,
  getBatchAnalysis,
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/dept-wise', getDeptWise);
router.get('/company-wise', getCompanyWise);
router.get('/batch-wise', getBatchWise);
router.get('/recent', getRecent);
router.get('/batch-analysis', getBatchAnalysis);

module.exports = router;

