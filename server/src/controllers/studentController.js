const Student = require('../models/Student');

// @desc    Get all students with search, filter, pagination
// @route   GET /api/students
exports.getStudents = async (req, res, next) => {
  try {
    const { search, department, batch, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) query.department = department;
    if (batch) query.batch = batch;
    if (status) query.status = status;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('placementId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      students,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('placementId');

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique batches
// @route   GET /api/students/batches/list
exports.getBatches = async (req, res, next) => {
  try {
    const batches = await Student.distinct('batch');
    res.json(batches.sort());
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk create students
// @route   POST /api/students/bulk
exports.bulkCreateStudents = async (req, res, next) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
      res.status(400);
      throw new Error('Students array is required');
    }

    const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML', 'Other'];
    const results = {
      successCount: 0,
      skippedCount: 0,
      errors: [],
      skipped: [],
    };

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowNum = i + 1;

      // Validate required fields
      if (!s.name || !s.rollNumber || !s.email || !s.department || !s.batch) {
        results.errors.push({
          row: rowNum,
          student: s,
          reason: 'Missing required fields (Name, Roll Number, Email, Department, Batch)',
        });
        results.skippedCount++;
        continue;
      }

      // Validate department
      if (!DEPARTMENTS.includes(s.department)) {
        results.errors.push({
          row: rowNum,
          student: s,
          reason: `Invalid department '${s.department}'. Must be one of: ${DEPARTMENTS.join(', ')}`,
        });
        results.skippedCount++;
        continue;
      }

      try {
        // Check duplicate rollNumber or email
        const existingStudent = await Student.findOne({
          $or: [
            { rollNumber: s.rollNumber.trim() },
            { email: s.email.trim().toLowerCase() }
          ]
        });

        if (existingStudent) {
          const reason = existingStudent.rollNumber === s.rollNumber.trim()
            ? `Roll Number '${s.rollNumber}' already exists`
            : `Email '${s.email}' already exists`;

          results.skipped.push({
            row: rowNum,
            student: s,
            reason,
          });
          results.skippedCount++;
          continue;
        }

        // Create student
        const newStudent = new Student({
          name: s.name.trim(),
          rollNumber: s.rollNumber.trim(),
          email: s.email.trim().toLowerCase(),
          phone: s.phone ? String(s.phone).trim() : '',
          department: s.department,
          batch: String(s.batch).trim(),
          cgpa: parseFloat(s.cgpa) || 0,
          skills: Array.isArray(s.skills) ? s.skills : [],
          status: 'not_placed',
          placementId: null
        });

        await newStudent.save();
        results.successCount++;
      } catch (err) {
        results.errors.push({
          row: rowNum,
          student: s,
          reason: err.message || 'Database error occurred',
        });
        results.skippedCount++;
      }
    }

    res.status(201).json(results);
  } catch (error) {
    next(error);
  }
};
