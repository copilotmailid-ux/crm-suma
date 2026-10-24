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
      chiefGuestEmail,
      chiefGuestPhone,
      chiefGuestBio,
      chiefGuestLinkedin,
      prerequisites,
      registrationDeadline,
      eventDate,
      endDate,
      isMultiDay,
      durationDays,
      scheduleType,
      dailyTimingNote,
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

    const parsedEventDate = eventDate ? new Date(eventDate) : new Date();
    const parsedEndDate = endDate ? new Date(endDate) : null;
    const computedIsMultiDay = Boolean(isMultiDay || (parsedEndDate && parsedEndDate > parsedEventDate));
    const computedDurationDays = computedIsMultiDay && parsedEndDate
      ? Math.max(1, Math.round((parsedEndDate - parsedEventDate) / (1000 * 60 * 60 * 24)) + 1)
      : (durationDays ? Number(durationDays) : 1);

    const newEvent = new PlacementEvent({
      title,
      chiefGuest,
      chiefGuestDesignation,
      chiefGuestCompany,
      chiefGuestEmail: chiefGuestEmail || '',
      chiefGuestPhone: chiefGuestPhone || '',
      chiefGuestBio: chiefGuestBio || '',
      chiefGuestLinkedin: chiefGuestLinkedin || '',
      prerequisites: prerequisites || '',
      registrationDeadline: registrationDeadline || null,
      eventDate: parsedEventDate,
      endDate: parsedEndDate,
      isMultiDay: computedIsMultiDay,
      durationDays: computedDurationDays,
      scheduleType: scheduleType || (computedIsMultiDay ? 'Multi-Day' : 'Single Day'),
      dailyTimingNote: dailyTimingNote || '',
      startTime: startTime || '10:00 AM',
      endTime: endTime || '01:00 PM',
      venue,
      departments: departments && departments.length ? departments : ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
      eligibleBatches: eligibleBatches && eligibleBatches.length ? eligibleBatches : ['2022-2026', '2023-2027'],
      eventType: eventType || 'Training',
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
      chiefGuestEmail,
      chiefGuestPhone,
      chiefGuestBio,
      chiefGuestLinkedin,
      prerequisites,
      registrationDeadline,
      eventDate,
      endDate,
      isMultiDay,
      durationDays,
      scheduleType,
      dailyTimingNote,
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
    if (chiefGuestEmail !== undefined) event.chiefGuestEmail = chiefGuestEmail;
    if (chiefGuestPhone !== undefined) event.chiefGuestPhone = chiefGuestPhone;
    if (chiefGuestBio !== undefined) event.chiefGuestBio = chiefGuestBio;
    if (chiefGuestLinkedin !== undefined) event.chiefGuestLinkedin = chiefGuestLinkedin;
    if (prerequisites !== undefined) event.prerequisites = prerequisites;
    if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline;
    if (eventDate !== undefined) event.eventDate = eventDate;
    if (endDate !== undefined) event.endDate = endDate || null;
    if (isMultiDay !== undefined) {
      event.isMultiDay = isMultiDay;
    } else if (endDate !== undefined) {
      event.isMultiDay = Boolean(endDate && new Date(endDate) > new Date(event.eventDate));
    }
    if (durationDays !== undefined) {
      event.durationDays = Number(durationDays);
    } else if (event.endDate && event.eventDate) {
      event.durationDays = Math.max(1, Math.round((new Date(event.endDate) - new Date(event.eventDate)) / (1000 * 60 * 60 * 24)) + 1);
    }
    if (scheduleType !== undefined) event.scheduleType = scheduleType;
    if (dailyTimingNote !== undefined) event.dailyTimingNote = dailyTimingNote;
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

// @desc    Register current student for an event/training
// @route   POST /api/events/:id/register
// @access  Private (Student)
const registerForEvent = async (req, res, next) => {
  try {
    const student = req.student || req.user;
    if (!student) {
      return res.status(401).json({ success: false, message: 'Please log in as a student to register' });
    }

    const event = await PlacementEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This event has been cancelled' });
    }

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline for this training has passed' });
    }

    const existingIndex = event.attendance.findIndex(
      (a) =>
        (a.studentId && a.studentId.toString() === student._id.toString()) ||
        a.rollNumber.toUpperCase() === student.rollNumber.toUpperCase()
    );

    if (existingIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event',
        data: event,
      });
    }

    if (event.maxParticipants && event.attendance.length >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Registration full. Maximum participants reached.',
      });
    }

    event.attendance.push({
      studentId: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber.toUpperCase(),
      department: (student.department || 'CSE').toUpperCase(),
      batch: student.batch || '2022-2026',
      status: 'Registered',
      markedAt: null,
      remarks: 'Self-registered via Student Portal',
    });

    await event.save();

    res.json({
      success: true,
      message: `Successfully registered for ${event.title}`,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unregister current student from an event/training
// @route   DELETE /api/events/:id/register
// @access  Private (Student)
const unregisterFromEvent = async (req, res, next) => {
  try {
    const student = req.student || req.user;
    if (!student) {
      return res.status(401).json({ success: false, message: 'Please log in as a student' });
    }

    const event = await PlacementEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const initialLen = event.attendance.length;
    event.attendance = event.attendance.filter(
      (a) =>
        !(
          (a.studentId && a.studentId.toString() === student._id.toString()) ||
          a.rollNumber.toUpperCase() === student.rollNumber.toUpperCase()
        )
    );

    if (event.attendance.length === initialLen) {
      return res.status(400).json({ success: false, message: 'You are not registered for this event' });
    }

    await event.save();

    res.json({
      success: true,
      message: `Successfully unregistered from ${event.title}`,
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
  registerForEvent,
  unregisterFromEvent,
};
