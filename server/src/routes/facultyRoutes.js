const express = require('express');
const router = express.Router();
const {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getTimeTable,
  saveTimeTableSlot,
  clearTimeTableSlot,
  resetDefaultTimeTable,
  getWorkloadAnalytics,
} = require('../controllers/facultyController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Timetable and Workload routes
router.get('/timetable', getTimeTable);
router.post('/timetable/slot', saveTimeTableSlot);
router.delete('/timetable/slot/:id', clearTimeTableSlot);
router.post('/timetable/reset-default', resetDefaultTimeTable);
router.get('/workload', getWorkloadAnalytics);

// Faculty CRUD routes
router.route('/').get(getFaculties).post(createFaculty);
router.route('/:id').put(updateFaculty).delete(deleteFaculty);

module.exports = router;
