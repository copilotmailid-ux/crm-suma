const PlacementEvent = require('../models/PlacementEvent');
const Student = require('../models/Student');

// @desc    Get all placement events
// @route   GET /api/events
// @access  Private (Admin)
const getEvents = async (req, res, next) => {
  try {
    const { status, department, search, eventType } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }

    if (department && department !== 'ALL') {
      query.departments = { $in: [department] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { chiefGuest: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { chiefGuestCompany: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await PlacementEvent.find(query).sort({ eventDate: 1, createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Private (Admin)
const getEventById = async (req, res, next) => {
  try {
    const event = await PlacementEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new upcoming placement event
// @route   POST /api/events
// @access  Private (Admin)
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      chiefGuest,
      chiefGuestDesignation,
      chiefGuestCompany,
      eventDate,
      startTime,
      endTime,
      venue,
      departments,
      eligibleBatches,
      eventType,
      status,
      description,
      maxParticipants,
      autoRegisterEligible,
    } = req.body;

    const newEvent = new PlacementEvent({
      title,
      chiefGuest,
      chiefGuestDesignation,
      chiefGuestCompany,
      eventDate,
      startTime: startTime || '10:00 AM',
      endTime: endTime || '01:00 PM',
      venue,
      departments: departments && departments.length ? departments : ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
      eligibleBatches: eligibleBatches && eligibleBatches.length ? eligibleBatches : ['2022-2026', '2023-2027'],
      eventType: eventType || 'Guest Lecture',
      status: status || 'Upcoming',
      description: description || '',
      maxParticipants: maxParticipants ? Number(maxParticipants) : 200,
    });

    // Optionally auto-populate registered attendance roster with students from selected departments
    if (autoRegisterEligible) {
      const eligibleStudents = await Student.find({
        department: { $in: newEvent.departments },
        batch: { $in: newEvent.eligibleBatches },
      }).limit(newEvent.maxParticipants || 150);

      newEvent.attendance = eligibleStudents.map((s) => ({
        studentId: s._id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        department: s.department,
        batch: s.batch,
        status: 'Registered',
        markedAt: null,
      }));
    }

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update placement event
// @route   PUT /api/events/:id
// @access  Private (Admin)
const updateEvent = async (req, res, next) => {
  try {
    const event = await PlacementEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const {
      title,
      chiefGuest,
      chiefGuestDesignation,
      chiefGuestCompany,
      eventDate,
      startTime,
      endTime,
      venue,
      departments,
      eligibleBatches,
      eventType,
      status,
      description,
      maxParticipants,
    } = req.body;

    if (title !== undefined) event.title = title;
    if (chiefGuest !== undefined) event.chiefGuest = chiefGuest;
    if (chiefGuestDesignation !== undefined) event.chiefGuestDesignation = chiefGuestDesignation;
    if (chiefGuestCompany !== undefined) event.chiefGuestCompany = chiefGuestCompany;
    if (eventDate !== undefined) event.eventDate = eventDate;
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (venue !== undefined) event.venue = venue;
    if (departments !== undefined) event.departments = departments;
    if (eligibleBatches !== undefined) event.eligibleBatches = eligibleBatches;
    if (eventType !== undefined) event.eventType = eventType;
    if (status !== undefined) event.status = status;
    if (description !== undefined) event.description = description;
    if (maxParticipants !== undefined) event.maxParticipants = Number(maxParticipants);

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete placement event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
const deleteEvent = async (req, res, next) => {
  try {
    const event = await PlacementEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add single student to event attendance roster
// @route   POST /api/events/:id/attendance
// @access  Private (Admin)
const addStudentToAttendance = async (req, res, next) => {
  try {
    const { studentId, studentName, rollNumber, department, batch, status } = req.body;

    const event = await PlacementEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if student already in attendance list
    const alreadyExists = event.attendance.some(
      (a) => a.rollNumber.toUpperCase() === rollNumber.toUpperCase()
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: `Student with roll number ${rollNumber} is already registered for this event`,
      });
    }

    event.attendance.push({
      studentId: studentId || null,
      studentName,
      rollNumber: rollNumber.toUpperCase(),
      department: department.toUpperCase(),
      batch: batch || '2022-2026',
      status: status || 'Present',
      markedAt: status === 'Present' ? new Date() : null,
    });

    await event.save();

    res.json({
      success: true,
      message: 'Student added to attendance roster',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update single student attendance status (Present / Absent / Registered)
// @route   PATCH /api/events/:id/attendance/:recordId
// @access  Private (Admin)
const updateAttendanceStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const { id, recordId } = req.params;

    const event = await PlacementEvent.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const record = event.attendance.id(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (status) {
      record.status = status;
      record.markedAt = status === 'Present' ? new Date() : record.markedAt;
    }
    if (remarks !== undefined) {
      record.remarks = remarks;
    }

    await event.save();

    res.json({
      success: true,
      message: 'Attendance status updated',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk update attendance (Mark All Present, Mark All Absent, or Array)
// @route   POST /api/events/:id/attendance/bulk
// @access  Private (Admin)
const bulkUpdateAttendance = async (req, res, next) => {
  try {
    const { action, status, department } = req.body; // action: 'mark_all', status: 'Present'|'Absent'
    const event = await PlacementEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const targetStatus = status || 'Present';
    const now = new Date();

    event.attendance.forEach((rec) => {
      if (!department || department === 'ALL' || rec.department === department) {
        rec.status = targetStatus;
        if (targetStatus === 'Present') rec.markedAt = now;
      }
    });

    await event.save();

    res.json({
      success: true,
      message: `Updated attendance to ${targetStatus} for ${department ? department : 'all'} students`,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Auto-register students by department and batch
// @route   POST /api/events/:id/auto-register
// @access  Private (Admin)
const autoRegisterStudents = async (req, res, next) => {
  try {
    const { department, batch, count } = req.body;
    const event = await PlacementEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const filter = {};
    if (department && department !== 'ALL') {
      filter.department = department;
    } else {
      filter.department = { $in: event.departments };
    }

    if (batch && batch !== 'ALL') {
      filter.batch = batch;
    } else if (event.eligibleBatches && event.eligibleBatches.length) {
      filter.batch = { $in: event.eligibleBatches };
    }

    const students = await Student.find(filter).limit(Number(count) || 100);

    const existingRolls = new Set(event.attendance.map((a) => a.rollNumber.toUpperCase()));
    let addedCount = 0;

    for (const s of students) {
      if (!existingRolls.has(s.rollNumber.toUpperCase())) {
        event.attendance.push({
          studentId: s._id,
          studentName: s.name,
          rollNumber: s.rollNumber.toUpperCase(),
          department: s.department.toUpperCase(),
          batch: s.batch,
          status: 'Registered',
          markedAt: null,
        });
        existingRolls.add(s.rollNumber.toUpperCase());
        addedCount++;
      }
    }

    await event.save();

    res.json({
      success: true,
      message: `Successfully registered ${addedCount} students for the event`,
      addedCount,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove student from event attendance roster
// @route   DELETE /api/events/:id/attendance/:recordId
// @access  Private (Admin)
const removeStudentFromAttendance = async (req, res, next) => {
  try {
    const { id, recordId } = req.params;
    const event = await PlacementEvent.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.attendance.pull({ _id: recordId });
    await event.save();

    res.json({
      success: true,
      message: 'Student removed from attendance roster',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
