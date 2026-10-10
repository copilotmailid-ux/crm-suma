const Faculty = require('../models/Faculty');
const TimeTableSlot = require('../models/TimeTableSlot');

// Initial default faculty list
const DEFAULT_FACULTIES = [
  { name: 'Dr. K. Ramesh', facultyCode: 'FAC-CSE-01', department: 'CSE', designation: 'Professor & Placement Coordinator', specialization: 'Data Structures & Algorithms', color: '#2563eb' },
  { name: 'Prof. M. Suresh', facultyCode: 'FAC-IT-02', department: 'IT', designation: 'Associate Professor', specialization: 'Full Stack & Web Technologies', color: '#0891b2' },
  { name: 'Mrs. S. Divya', facultyCode: 'FAC-AD-03', department: 'AIDS', designation: 'Assistant Professor', specialization: 'Python & Machine Learning', color: '#7c3aed' },
  { name: 'Dr. P. Senthil Kumar', facultyCode: 'FAC-ECE-04', department: 'ECE', designation: 'Associate Professor', specialization: 'Embedded Systems & IoT', color: '#d97706' },
  { name: 'Prof. V. Karthik', facultyCode: 'FAC-EEE-05', department: 'EEE', designation: 'Assistant Professor', specialization: 'Circuit Theory & Power Systems', color: '#059669' },
  { name: 'Prof. A. Balaji', facultyCode: 'FAC-ME-06', department: 'MECH', designation: 'Assistant Professor', specialization: 'Design & Automation', color: '#ea580c' },
  { name: 'Mrs. R. Priya', facultyCode: 'FAC-CE-07', department: 'CE', designation: 'Assistant Professor', specialization: 'Structural Engineering', color: '#dc2626' },
  { name: 'Mr. N. Anand', facultyCode: 'FAC-TR-08', department: 'Placement', designation: 'Lead Placement Trainer', specialization: 'Quantitative Aptitude & Logical Reasoning', color: '#4f46e5' },
  { name: 'Ms. T. Meena', facultyCode: 'FAC-TR-09', department: 'Placement', designation: 'Soft Skills Trainer', specialization: 'Verbal Ability & Interview Prep', color: '#db2777' },
];

// Initial default slots matching the college placement time table sheet with 1st, 2nd, 3rd, and 4th years
const DEFAULT_SLOTS = [
  // MON
  { day: 'MON', period: 1, span: 1, className: 'I- CSE', department: 'CSE', year: 'I', topic: 'Python Programming Fundamentals', facultyName: 'Dr. K. Ramesh' },
  { day: 'MON', period: 2, span: 1, className: 'I- IT', department: 'IT', year: 'I', topic: 'Computer Fundamentals & C Programming', facultyName: 'Prof. M. Suresh' },
  { day: 'MON', period: 3, span: 1, className: 'III- EEE', department: 'EEE', year: 'III', topic: 'Circuit Theory & Technical Aptitude', facultyName: 'Prof. V. Karthik' },
  { day: 'MON', period: 6, span: 1, className: 'IV- ECE', department: 'ECE', year: 'IV', topic: 'Embedded Systems & Core Assessment', facultyName: 'Dr. P. Senthil Kumar' },

  // TUE
  { day: 'TUE', period: 1, span: 1, className: 'I- EEE', department: 'EEE', year: 'I', topic: 'Engineering Physics & Electrical Basics', facultyName: 'Prof. V. Karthik' },
  { day: 'TUE', period: 3, span: 1, className: 'II- IT', department: 'IT', year: 'II', topic: 'C++ & Object-Oriented Programming', facultyName: 'Prof. M. Suresh' },
  { day: 'TUE', period: 4, span: 1, className: 'II- MECH', department: 'MECH', year: 'II', topic: 'Engineering Mechanics & Aptitude', facultyName: 'Prof. A. Balaji' },
  { day: 'TUE', period: 5, span: 1, className: 'II- AD', department: 'AIDS', year: 'II', topic: 'Python Programming & Problem Solving', facultyName: 'Mrs. S. Divya' },
  { day: 'TUE', period: 7, span: 1, className: 'II- ECE', department: 'ECE', year: 'II', topic: 'Digital Electronics & Logic Circuits', facultyName: 'Dr. P. Senthil Kumar' },

  // WED
  { day: 'WED', period: 1, span: 1, className: 'I- AIDS', department: 'AIDS', year: 'I', topic: 'Mathematics & Logical Problem Solving', facultyName: 'Mrs. S. Divya' },
  { day: 'WED', period: 3, span: 1, className: 'III- MECH', department: 'MECH', year: 'III', topic: 'Thermal Engineering & Aptitude', facultyName: 'Prof. A. Balaji' },
  { day: 'WED', period: 4, span: 1, className: 'III- CE', department: 'CE', year: 'III', topic: 'Surveying & Structural Analysis', facultyName: 'Mrs. R. Priya' },
  { day: 'WED', period: 5, span: 1, className: 'II- CSE', department: 'CSE', year: 'II', topic: 'Data Structures Foundation & Algorithms', facultyName: 'Dr. K. Ramesh' },
  { day: 'WED', period: 7, span: 1, className: 'III- CSE', department: 'CSE', year: 'III', topic: 'Competitive Programming & DSA', facultyName: 'Dr. K. Ramesh' },

  // THU
  { day: 'THU', period: 1, span: 1, className: 'III- IT', department: 'IT', year: 'III', topic: 'Full Stack Web Development & Database', facultyName: 'Prof. M. Suresh' },
  { day: 'THU', period: 2, span: 1, className: 'I- ECE', department: 'ECE', year: 'I', topic: 'Basic Electrical & Electronics', facultyName: 'Dr. P. Senthil Kumar' },
  { day: 'THU', period: 3, span: 1, className: 'III- AD', department: 'AIDS', year: 'III', topic: 'Machine Learning & Predictive Modeling', facultyName: 'Mrs. S. Divya' },
  { day: 'THU', period: 4, span: 1, className: 'II- CE', department: 'CE', year: 'II', topic: 'Construction Materials & Aptitude', facultyName: 'Mrs. R. Priya' },
  { day: 'THU', period: 5, span: 1, className: 'III- EE', department: 'EEE', year: 'III', topic: 'Power Electronics & Control Systems', facultyName: 'Prof. V. Karthik' },
  { day: 'THU', period: 7, span: 1, className: 'II- EEE', department: 'EEE', year: 'II', topic: 'Electrical Machines & Technical Fundamentals', facultyName: 'Prof. V. Karthik' },

  // FRI (Each period is its own separate distinct cell)
  { day: 'FRI', period: 2, span: 1, className: 'IV- IT & AD', department: 'IT & AIDS', year: 'IV', topic: 'Placement Mock Coding & Technical Rounds', facultyName: 'Prof. M. Suresh' },
  { day: 'FRI', period: 3, span: 1, className: 'IV- IT & AD', department: 'IT & AIDS', year: 'IV', topic: 'Placement Mock Coding & Technical Rounds', facultyName: 'Prof. M. Suresh' },
  { day: 'FRI', period: 5, span: 1, className: 'IV - EEE, CE, & MECH', department: 'Core Engineering', year: 'IV', topic: 'Quantitative Aptitude & Core Interview Prep', facultyName: 'Mr. N. Anand' },
  { day: 'FRI', period: 6, span: 1, className: 'IV - EEE, CE, & MECH', department: 'Core Engineering', year: 'IV', topic: 'Quantitative Aptitude & Core Interview Prep', facultyName: 'Mr. N. Anand' },
  { day: 'FRI', period: 7, span: 1, className: 'IV - EEE, CE, & MECH', department: 'Core Engineering', year: 'IV', topic: 'Quantitative Aptitude & Core Interview Prep', facultyName: 'Mr. N. Anand' },

  // SAT (Each period is its own separate distinct cell)
  { day: 'SAT', period: 1, span: 1, className: 'IV - CSE', department: 'CSE', year: 'IV', topic: 'Product Company DSA & System Design Prep', facultyName: 'Dr. K. Ramesh' },
  { day: 'SAT', period: 2, span: 1, className: 'IV - CSE', department: 'CSE', year: 'IV', topic: 'Product Company DSA & System Design Prep', facultyName: 'Dr. K. Ramesh' },
  { day: 'SAT', period: 3, span: 1, className: 'IV - CSE', department: 'CSE', year: 'IV', topic: 'Product Company DSA & System Design Prep', facultyName: 'Dr. K. Ramesh' },
];

// Helper: Ensure initial faculties and slots exist
const ensureSeeded = async () => {
  const count = await Faculty.countDocuments();
  if (count === 0) {
    await Faculty.insertMany(DEFAULT_FACULTIES);
  }

  const slotCount = await TimeTableSlot.countDocuments({ academicYear: '2026-2027', semester: 'ODD SEM' });
  if (slotCount === 0) {
    const faculties = await Faculty.find();
    const facultyMap = {};
    faculties.forEach((f) => {
      facultyMap[f.name] = f._id;
    });

    const slotsToInsert = DEFAULT_SLOTS.map((s) => ({
      ...s,
      academicYear: '2026-2027',
      semester: 'ODD SEM',
      facultyId: facultyMap[s.facultyName] || null,
    }));

    await TimeTableSlot.insertMany(slotsToInsert);
  }
};

// @desc    Get all faculty members
// @route   GET /api/faculty
exports.getFaculties = async (req, res, next) => {
  try {
    await ensureSeeded();
    const { department, search } = req.query;
    const query = {};

    if (department && department !== 'ALL') {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { facultyCode: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }

    const faculties = await Faculty.find(query).sort({ department: 1, name: 1 });
    res.json(faculties);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new faculty
// @route   POST /api/faculty
exports.createFaculty = async (req, res, next) => {
  try {
    const { name, facultyCode, department, designation, email, phone, specialization, color } = req.body;

    if (!name || !department) {
      return res.status(400).json({ message: 'Name and Department are required' });
    }

    const faculty = await Faculty.create({
      name: name.trim(),
      facultyCode: facultyCode ? facultyCode.trim() : `FAC-${Date.now().toString().slice(-4)}`,
      department,
      designation: designation || 'Placement Trainer',
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      specialization: specialization ? specialization.trim() : '',
      color: color || '#2563eb',
    });

    res.status(201).json(faculty);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a faculty
// @route   PUT /api/faculty/:id
exports.updateFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Also sync facultyName on all timetable slots
    if (req.body.name) {
      await TimeTableSlot.updateMany({ facultyId: faculty._id }, { facultyName: req.body.name.trim() });
    }

    res.json(faculty);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a faculty
// @route   DELETE /api/faculty/:id
exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Unassign this faculty from timetable slots
    await TimeTableSlot.updateMany({ facultyId: faculty._id }, { facultyId: null, facultyName: '' });

    res.json({ message: 'Faculty removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Time Table slots
// @route   GET /api/faculty/timetable
exports.getTimeTable = async (req, res, next) => {
  try {
    await ensureSeeded();
    const academicYear = req.query.academicYear || '2026-2027';
    const semester = req.query.semester || 'ODD SEM';

    const slots = await TimeTableSlot.find({ academicYear, semester }).populate('facultyId');
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update a single Time Table slot
// @route   POST /api/faculty/timetable/slot
exports.saveTimeTableSlot = async (req, res, next) => {
  try {
    const {
      academicYear = '2026-2027',
      semester = 'ODD SEM',
      day,
      period,
      periods,
      className,
      department,
      year,
      facultyId,
      topic,
      room,
    } = req.body;

    const targetPeriods = Array.isArray(periods) && periods.length > 0 ? periods : (period ? [Number(period)] : []);

    if (!day || targetPeriods.length === 0) {
      return res.status(400).json({ message: 'Day and at least one period are required' });
    }

    let facultyName = '';
    if (facultyId) {
      const f = await Faculty.findById(facultyId);
      if (f) facultyName = f.name;
    }

    let slotYear = year ? String(year).trim() : '';
    let slotDept = department ? String(department).trim() : '';
    if (className) {
      const upper = className.toUpperCase();
      if (!slotYear) {
        if (upper.includes('IV') || upper.startsWith('4')) slotYear = 'IV';
        else if (upper.includes('III') || upper.startsWith('3')) slotYear = 'III';
        else if (upper.includes('II') || upper.startsWith('2')) slotYear = 'II';
        else if (upper.includes('I-') || upper.startsWith('1')) slotYear = 'I';
      }
      if (!slotDept) {
        for (const d of ['CSE', 'IT', 'AIDS', 'AD', 'ECE', 'EEE', 'MECH', 'CE', 'Placement']) {
          if (upper.includes(d)) {
            slotDept = d === 'AD' ? 'AIDS' : d;
            break;
          }
        }
      }
    }

    const savedSlots = [];
    for (const p of targetPeriods) {
      // If empty className and no faculty, remove the slot
      if (!className && !facultyId && !topic) {
        await TimeTableSlot.findOneAndDelete({ academicYear, semester, day, period: p });
      } else {
        const slot = await TimeTableSlot.findOneAndUpdate(
          { academicYear, semester, day, period: p },
          {
            span: 1, // Keep each period distinct and separate!
            className: className ? className.trim() : '',
            department: slotDept,
            year: slotYear,
            facultyId: facultyId || null,
            facultyName,
            topic: topic ? topic.trim() : '',
            room: room ? room.trim() : '',
          },
          { upsert: true, new: true, runValidators: true }
        ).populate('facultyId');
        savedSlots.push(slot);
      }
    }

    res.json(savedSlots.length === 1 ? savedSlots[0] : { message: 'Slots updated successfully', slots: savedSlots });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear / Delete a Time Table slot
// @route   DELETE /api/faculty/timetable/slot/:id
exports.clearTimeTableSlot = async (req, res, next) => {
  try {
    const slot = await TimeTableSlot.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    res.json({ message: 'Slot cleared successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset / Seed Default Time Table from official template
// @route   POST /api/faculty/timetable/reset-default
exports.resetDefaultTimeTable = async (req, res, next) => {
  try {
    const academicYear = '2026-2027';
    const semester = 'ODD SEM';

    await TimeTableSlot.deleteMany({ academicYear, semester });

    const faculties = await Faculty.find();
    const facultyMap = {};
    faculties.forEach((f) => {
      facultyMap[f.name] = f._id;
    });

    const slotsToInsert = DEFAULT_SLOTS.map((s) => ({
      ...s,
      academicYear,
      semester,
      facultyId: facultyMap[s.facultyName] || null,
    }));

    const inserted = await TimeTableSlot.insertMany(slotsToInsert);
    res.json({ message: 'Time Table reset to official template successfully!', count: inserted.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Workload & Period Analytics (Day-wise and Week-wise per faculty)
// @route   GET /api/faculty/workload
exports.getWorkloadAnalytics = async (req, res, next) => {
  try {
    await ensureSeeded();
    const academicYear = req.query.academicYear || '2026-2027';
    const semester = req.query.semester || 'ODD SEM';

    const faculties = await Faculty.find().sort({ department: 1, name: 1 });
    const slots = await TimeTableSlot.find({ academicYear, semester }).populate('facultyId');

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const workloadList = faculties.map((faculty) => {
      const dayBreakdown = {
        MON: 0,
        TUE: 0,
        WED: 0,
        THU: 0,
        FRI: 0,
        SAT: 0,
      };

      const assignedClasses = [];

      slots.forEach((s) => {
        const matchesId = s.facultyId && String(s.facultyId._id || s.facultyId) === String(faculty._id);
        const matchesName = s.facultyName && s.facultyName.toLowerCase() === faculty.name.toLowerCase();

        if (matchesId || matchesName) {
          const count = s.span || 1;
          if (dayBreakdown[s.day] !== undefined) {
            dayBreakdown[s.day] += count;
          }
          assignedClasses.push({
            day: s.day,
            period: s.period,
            span: s.span || 1,
            className: s.className,
            topic: s.topic,
            room: s.room,
          });
        }
      });

      const totalWeekPeriods = days.reduce((sum, d) => sum + dayBreakdown[d], 0);

      return {
        facultyId: faculty._id,
        name: faculty.name,
        facultyCode: faculty.facultyCode,
        department: faculty.department,
        designation: faculty.designation,
        specialization: faculty.specialization,
        color: faculty.color,
        dayBreakdown,
        totalWeekPeriods,
        assignedClasses,
      };
    });

    // Also summary across days
    const totalDayPeriods = {};
    days.forEach((d) => {
      totalDayPeriods[d] = slots
        .filter((s) => s.day === d && s.className)
        .reduce((sum, s) => sum + (s.span || 1), 0);
    });

    res.json({
      academicYear,
      semester,
      totalDayPeriods,
      workloads: workloadList,
    });
  } catch (error) {
    next(error);
  }
};
