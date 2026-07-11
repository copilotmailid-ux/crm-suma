const express = require('express');
const router = express.Router();
const {
  getAlumni,
  getAlumniById,
  updateAlumni,
  deleteAlumni,
} = require('../controllers/alumniController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/').get(getAlumni);
router.route('/:id').get(getAlumniById).put(updateAlumni).delete(deleteAlumni);

module.exports = router;
