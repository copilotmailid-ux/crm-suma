const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getBatches,
  bulkCreateStudents,
} = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/batches/list', getBatches);
router.post('/bulk', bulkCreateStudents);
router.route('/').get(getStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).delete(deleteStudent);

module.exports = router;
