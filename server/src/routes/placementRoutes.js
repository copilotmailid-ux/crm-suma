const express = require('express');
const router = express.Router();
const {
  getPlacements,
  getPlacement,
  createPlacement,
  updatePlacement,
  deletePlacement,
} = require('../controllers/placementController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/').get(getPlacements).post(createPlacement);
router.route('/:id').get(getPlacement).put(updatePlacement).delete(deletePlacement);

module.exports = router;
