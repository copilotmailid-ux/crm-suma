const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getAllCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/all', getAllCompanies);
router.route('/').get(getCompanies).post(createCompany);
router.route('/:id').get(getCompany).put(updateCompany).delete(deleteCompany);

module.exports = router;
