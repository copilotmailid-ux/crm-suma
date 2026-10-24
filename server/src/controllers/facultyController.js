const Faculty = require('../models/Faculty');
const TimeTableSlot = require('../models/TimeTableSlot');
const { DEFAULT_FACULTIES, DEFAULT_SLOTS } = require('../seed/timetableSeed');

// Helper: Ensure deduplicated faculties and clean seeded timetable
const ensureSeeded = async () => {
  // 1. Ensure all default faculties exist without duplicates
  for (const fac of DEFAULT_FACULTIES) {
    const existing = await Faculty.findOne({
      $or: [{ facultyCode: fac.facultyCode }, { name: fac.name }],
    });
    if (!existing) {
      await Faculty.create(fac);
    }
  }

  // 2. Remove any duplicate faculty documents (if any exist with identical facultyCode or name)
  const allFaculties = await Faculty.find().sort({ createdAt: 1 });
  const seenCodes = new Map(); // facultyCode -> primaryId
  const seenNames = new Map(); // name -> primaryId

  for (const f of allFaculties) {
    const codeKey = f.facultyCode || f.name;
    const nameKey = f.name;

    if (seenCodes.has(codeKey) || seenNames.has(nameKey)) {
      const primaryId = seenCodes.get(codeKey) || seenNames.get(nameKey);
      // Remap any slots pointing to this duplicate faculty to the primary faculty
      await TimeTableSlot.updateMany({ facultyId: f._id }, { facultyId: primaryId, facultyName: f.name });
      await Faculty.findByIdAndDelete(f._id);
    } else {
      seenCodes.set(codeKey, f._id);
      seenNames.set(nameKey, f._id);
    }
  }

  // 3. Ensure timetable slots exist
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

    const code = facultyCode ? facultyCode.trim() : `FAC-${Date.now().toString().slice(-4)}`;

    // Check if code or name already exists
    const duplicate = await Faculty.findOne({
      $or: [{ facultyCode: code }, { name: name.trim() }],
    });
    if (duplicate) {
      return res.status(400).json({ message: `Faculty with code "${code}" or name "${name}" already exists` });
    }

    const faculty = await Faculty.create({
      name: name.trim(),
      facultyCode: code,
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

// @desc    Save/Update a single or multi-period Time Table slot with Conflict Detection
// @route   POST /api/faculty/timetable/slot
exports.saveTimeTableSlot = async (req, res, next) => {
  try {
    const {
      slotId,
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

    const targetPeriods =
      Array.isArray(periods) && periods.length > 0
        ? periods.map(Number)
        : (period ? [Number(period)] : []);

    if (!day || targetPeriods.length === 0) {
      return res.status(400).json({ message: 'Day and at least one period are required' });
    }

    let facultyObj = null;
    let facultyName = '';
    if (facultyId) {
      facultyObj = await Faculty.findById(facultyId);
      if (facultyObj) facultyName = facultyObj.name;
    }

    let slotYear = year ? String(year).trim() : '';
    let slotDept = department ? String(department).trim() : '';
    let finalClassName = className ? className.trim() : '';

    if (finalClassName) {
      const upper = finalClassName.toUpperCase();
      if (!slotYear) {
        if (upper.includes('IV') || upper.startsWith('4')) slotYear = '4';
        else if (upper.includes('III') || upper.startsWith('3')) slotYear = '3';
        else if (upper.includes('II') || upper.startsWith('2')) slotYear = '2';
        else if (upper.includes('I-') || upper.startsWith('1')) slotYear = '1';
      }
      if (!slotDept) {
        for (const d of ['CSE', 'IT', 'AIDS', 'AD', 'ECE', 'EEE', 'MECH', 'CE', 'Placement']) {
          if (upper.includes(d)) {
            slotDept = d === 'AD' ? 'AIDS' : d;
            break;
          }
        }
      }
    } else if (slotDept && slotYear) {
      const roman = slotYear === '1' ? 'I' : slotYear === '2' ? 'II' : slotYear === '3' ? 'III' : slotYear === '4' ? 'IV' : slotYear;
      finalClassName = `${roman}- ${slotDept}`;
    }

    // =========================================================================
    // CONFLICT DETECTION: Ensure staff is NOT assigned twice in the same period!
    // =========================================================================
    if (facultyId && facultyObj) {
      for (const p of targetPeriods) {
        const conflictQuery = {
          academicYear,
          semester,
          day,
          period: p,
          facultyId: facultyObj._id,
        };

        const exclusions = [];
        if (slotId) exclusions.push({ _id: slotId });
        if (finalClassName) exclusions.push({ className: finalClassName });
        if (exclusions.length > 0) {
          conflictQuery.$nor = exclusions;
        }

        const existingSlot = await TimeTableSlot.findOne(conflictQuery);
        if (existingSlot) {
          if (req.body.reassignStaff) {
            // Unassign staff from previous conflicting slot so they are moved here
            await TimeTableSlot.findByIdAndUpdate(existingSlot._id, {
              facultyId: null,
              facultyName: '',
            });
          } else {
            return res.status(409).json({
              conflict: true,
              type: 'FACULTY_CONFLICT',
              message: `Conflict: ${facultyName} is already assigned to "${existingSlot.className}" (${existingSlot.department || 'Department'}) on ${day} Period ${p}!`,
              conflictSlotId: existingSlot._id,
              details: {
                facultyName,
                assignedClass: existingSlot.className,
                department: existingSlot.department,
                year: existingSlot.year,
                day,
                period: p,
              },
            });
          }
        }
      }
    }

    // Process and save slots for each target period
    const savedSlots = [];
    for (const p of targetPeriods) {
      // If clearing the slot
      if (!finalClassName && !facultyId && !topic) {
        if (slotId) {
          await TimeTableSlot.findByIdAndDelete(slotId);
        } else {
          await TimeTableSlot.findOneAndDelete({
            academicYear,
            semester,
            day,
            period: p,
            ...(finalClassName ? { className: finalClassName } : {}),
          });
        }
      } else {
        // Upsert by slotId or by (academicYear, semester, day, period, className)
        let filter;
        if (slotId) {
          filter = { _id: slotId };
        } else {
          filter = {
            academicYear,
            semester,
            day,
            period: p,
            className: finalClassName,
          };
        }

        const updateData = {
          academicYear,
          semester,
          day,
          period: p,
          span: 1,
          className: finalClassName,
          department: slotDept,
          year: slotYear,
          facultyId: facultyId || null,
          facultyName,
          topic: topic ? topic.trim() : '',
          room: room ? room.trim() : '',
        };

        const slot = await TimeTableSlot.findOneAndUpdate(
          filter,
          updateData,
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

    // 1. Clean out all old slots
    await TimeTableSlot.deleteMany({ academicYear, semester });

    // 2. Ensure faculties are deduplicated
    for (const fac of DEFAULT_FACULTIES) {
      await Faculty.findOneAndUpdate(
        { facultyCode: fac.facultyCode },
        { $set: fac },
        { upsert: true, new: true }
      );
    }

    // Clean any remaining duplicates
    const allFaculties = await Faculty.find().sort({ createdAt: 1 });
    const seenCodes = new Set();
    for (const f of allFaculties) {
      if (seenCodes.has(f.facultyCode)) {
        await Faculty.findByIdAndDelete(f._id);
      } else {
        seenCodes.add(f.facultyCode);
      }
    }

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
            department: s.department,
            year: s.year,
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

    // Summary across days
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
