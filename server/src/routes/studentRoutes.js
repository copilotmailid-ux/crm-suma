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
  getStudentDrives,
  uploadStudentOfferLetter,
  deleteStudentOfferLetter,
} = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/batches/list', getBatches);
router.post('/bulk', bulkCreateStudents);

// Student drives history & offer letter endpoints
router.get('/:id/drives', getStudentDrives);
router.post('/:id/offer-letter', uploadStudentOfferLetter);
router.delete('/:id/offer-letter', deleteStudentOfferLetter);

router.route('/').get(getStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).delete(deleteStudent);

module.exports = router;
