const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addStudentToAttendance,
  updateAttendanceStatus,
  bulkUpdateAttendance,
  autoRegisterStudents,
  removeStudentFromAttendance,
  registerForEvent,
  unregisterFromEvent,
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.route('/:id')
  .get(getEventById)
  .put(updateEvent)
  .delete(deleteEvent);

router.route('/:id/register')
  .post(registerForEvent)
  .delete(unregisterFromEvent);

router.route('/:id/attendance')
  .post(addStudentToAttendance);

router.route('/:id/attendance/bulk')
  .post(bulkUpdateAttendance);

router.route('/:id/auto-register')
  .post(autoRegisterStudents);

router.route('/:id/attendance/:recordId')
  .patch(updateAttendanceStatus)
  .delete(removeStudentFromAttendance);

module.exports = router;
