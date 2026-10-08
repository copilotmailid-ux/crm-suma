const Drive = require('../models/Drive');
const Company = require('../models/Company');
const Student = require('../models/Student');
const Placement = require('../models/Placement');
const Alumni = require('../models/Alumni');
const {
  sendRoundShortlistEmail,
  sendFinalSelectionEmail,
  resetTransporter,
  sendTestEmail,
} = require('../utils/emailService');

// @desc    Get all company placement drives / requirements
// @route   GET /api/drives
exports.getDrives = async (req, res, next) => {
  try {
    const { search, department, batch, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (department) query.eligibleDepartments = department;
    if (batch) query.eligibleBatches = batch;

    const drives = await Drive.find(query)
      .populate('companyId', 'name industry website contactPerson contactEmail')
      .populate('registeredStudents', 'name rollNumber department cgpa email phone')
      .populate('finalSelectedStudents.studentId', 'name rollNumber department')
      .sort({ driveDate: 1 });

    res.json(drives);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single drive details
// @route   GET /api/drives/:id
exports.getDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id)
      .populate('companyId')
      .populate('registeredStudents', 'name rollNumber department batch cgpa email phone resumeUrl')
      .populate('rounds.candidates.studentId', 'name rollNumber department batch cgpa email phone resumeUrl')
      .populate('finalSelectedStudents.studentId', 'name rollNumber department batch cgpa email phone')
      .populate('finalSelectedStudents.placementId');

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    res.json(drive);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new company drive / requirements (Admin)
// @route   POST /api/drives
exports.createDrive = async (req, res, next) => {
  try {
    const {
      companyId,
      companyName,
      title,
      role,
      package: pkg,
      jobLocation,
      eligibleDepartments,
      eligibleBatches,
      minCgpa,
      minTenthMarks,
      minTwelfthMarks,
      maxCurrentArrears,
      maxHistoryArrears,
      driveDate,
      registrationDeadline,
      status,
      jobDescription,
      selectionProcess,
      applicationLink,
    } = req.body;

    let compId = companyId;
    let compName = companyName;

    // If companyId provided, get company name
    if (companyId) {
      const company = await Company.findById(companyId);
      if (company) {
        compName = company.name;
      }
    } else if (companyName) {
      // Find or create company
      let company = await Company.findOne({ name: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') } });
      if (!company) {
        company = await Company.create({
          name: companyName.trim(),
          industry: 'IT / Product',
          description: `Visiting company for ${title || 'Campus Placement'}`,
        });
      }
      compId = company._id;
      compName = company.name;
    }

    if (!compName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const dDate = driveDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const initialSelectionProcess = selectionProcess || 'Round 1: Online Assessment, Round 2: Technical Interview, Round 3: HR Interview';

    // Parse selection process to initialize default rounds
    const roundNames = initialSelectionProcess
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const initialRounds = roundNames.map((name, idx) => ({
      roundNumber: idx + 1,
      name: name.startsWith('Round') ? name : `Round ${idx + 1}: ${name}`,
      type: idx === 0 ? 'Online Assessment' : idx === roundNames.length - 1 ? 'HR Interview' : 'Technical Interview',
      scheduledDate: idx === 0 ? dDate : null,
      venue: jobLocation || 'Campus / Online',
      instructions: idx === 0 ? 'Aptitude & Technical Online Assessment' : '',
      status: idx === 0 ? 'In Progress' : 'Upcoming',
      candidates: [],
    }));

    const drive = await Drive.create({
      companyId: compId,
      companyName: compName,
      title: title || `${compName} Campus Recruitment Drive`,
      role,
      package: Number(pkg) || 0,
      jobLocation: jobLocation || 'Pan India / Hybrid',
      eligibleDepartments: eligibleDepartments || ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
      eligibleBatches: eligibleBatches || ['2022-2026', '2021-2025'],
      minCgpa: minCgpa !== undefined ? Number(minCgpa) : 6.0,
      minTenthMarks: minTenthMarks !== undefined ? Number(minTenthMarks) : 60,
      minTwelfthMarks: minTwelfthMarks !== undefined ? Number(minTwelfthMarks) : 60,
      maxCurrentArrears: maxCurrentArrears !== undefined ? Number(maxCurrentArrears) : 0,
      maxHistoryArrears: maxHistoryArrears !== undefined ? Number(maxHistoryArrears) : 2,
      driveDate: dDate,
      registrationDeadline: registrationDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: status || 'Upcoming',
      jobDescription: jobDescription || '',
      selectionProcess: initialSelectionProcess,
      applicationLink: applicationLink || '',
      currentRound: 1,
      rounds: initialRounds.length > 0 ? initialRounds : [
        {
          roundNumber: 1,
          name: 'Round 1: Online Assessment',
          type: 'Online Assessment',
          scheduledDate: dDate,
          venue: jobLocation || 'Campus / Online',
          status: 'In Progress',
          candidates: [],
        },
      ],
    });

    res.status(201).json({
      message: 'Placement drive created successfully!',
      drive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company drive requirements (Admin)
// @route   PUT /api/drives/:id
exports.updateDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    Object.assign(drive, req.body);
    await drive.save();

    res.json({
      message: 'Placement drive updated successfully!',
      drive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company drive (Admin)
// @route   DELETE /api/drives/:id
exports.deleteDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    await drive.deleteOne();
    res.json({ message: 'Placement drive deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Student applies / registers for drive
// @route   POST /api/drives/:id/apply
exports.applyForDrive = async (req, res, next) => {
  try {
    const drive = await Drive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    const student = req.student;

    // Check Eligibility Criteria:
    // 1. Department
    if (!drive.eligibleDepartments.includes(student.department)) {
      return res.status(400).json({
        message: `Your department (${student.department}) is not eligible for this drive. Eligible: ${drive.eligibleDepartments.join(', ')}`,
      });
    }

    // 2. CGPA
    if (student.cgpa < drive.minCgpa) {
      return res.status(400).json({
        message: `Minimum CGPA required is ${drive.minCgpa}. Your CGPA is ${student.cgpa}.`,
      });
    }

    // 3. Current Arrears
    if (student.currentArrears > drive.maxCurrentArrears) {
      return res.status(400).json({
        message: `Maximum live standing arrears allowed is ${drive.maxCurrentArrears}. You currently have ${student.currentArrears}.`,
      });
    }

    // Check if already registered
    const alreadyRegistered = drive.registeredStudents.some(
      (id) => id.toString() === student._id.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'You have already registered for this placement drive' });
    }

    drive.registeredStudents.push(student._id);

    // Also add student to Round 1 candidates if rounds exist
    if (drive.rounds && drive.rounds.length > 0) {
      const round1 = drive.rounds.find((r) => r.roundNumber === 1);
      if (round1) {
        const inRound1 = round1.candidates.some(
          (c) => c.studentId.toString() === student._id.toString()
        );
        if (!inRound1) {
          round1.candidates.push({
            studentId: student._id,
            status: 'pending',
          });
        }
      }
    }

    await drive.save();

    res.json({
      message: `Successfully registered for ${drive.companyName} placement drive!`,
      registered: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidates (registered & eligible), rounds pipeline, and final selections (Admin)
// @route   GET /api/drives/:id/candidates
exports.getDriveCandidates = async (req, res, next) => {
  try {
    let drive = await Drive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({ message: 'Placement drive not found' });
    }

    let shouldSave = false;

    // Auto-initialize rounds if empty
    if (!drive.rounds || drive.rounds.length === 0) {
      const selectionProcess = drive.selectionProcess || 'Round 1: Online Assessment, Round 2: Technical Interview, Round 3: HR Interview';
      const roundNames = selectionProcess
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      drive.rounds = roundNames.map((name, idx) => ({
        roundNumber: idx + 1,
        name: name.startsWith('Round') ? name : `Round ${idx + 1}: ${name}`,
        type: idx === 0 ? 'Online Assessment' : idx === roundNames.length - 1 ? 'HR Interview' : 'Technical Interview',
        scheduledDate: idx === 0 ? drive.driveDate : null,
        venue: drive.jobLocation || 'Campus / Online',
        instructions: idx === 0 ? 'Initial online screening & aptitude assessment' : '',
        status: idx === 0 ? 'In Progress' : 'Upcoming',
        candidates:
          idx === 0
            ? (drive.registeredStudents || []).map((sid) => ({
                studentId: sid,
                status: 'pending',
              }))
            : [],
      }));

      drive.currentRound = 1;
      shouldSave = true;
    } else {
      // Ensure all registered students are synced into Round 1
      const round1 = drive.rounds.find((r) => r.roundNumber === 1);
      if (round1) {
        const currentCandSet = new Set(round1.candidates.map((c) => c.studentId.toString()));
        for (const sid of drive.registeredStudents || []) {
          if (!currentCandSet.has(sid.toString())) {
            round1.candidates.push({
              studentId: sid,
              status: 'pending',
            });
            shouldSave = true;
          }
        }
      }
    }

    if (shouldSave) {
      await drive.save();
    }

    // Fully populate drive
    drive = await Drive.findById(req.params.id)
      .populate('companyId')
      .populate({
        path: 'registeredStudents',
        select:
          'name rollNumber department batch cgpa currentArrears historyOfArrears tenthPercentage twelfthPercentage email phone resumeUrl linkedinUrl careerPreference status',
      })
      .populate({
        path: 'rounds.candidates.studentId',
        select:
          'name rollNumber department batch cgpa currentArrears historyOfArrears tenthPercentage twelfthPercentage email phone resumeUrl linkedinUrl careerPreference status',
      })
      .populate({
        path: 'finalSelectedStudents.studentId',
        select:
          'name rollNumber department batch cgpa currentArrears tenthPercentage twelfthPercentage email phone resumeUrl careerPreference status',
      })
      .populate('finalSelectedStudents.placementId');

    // Build query for all eligible students in the college
    const eligibleQuery = {
      department: { $in: drive.eligibleDepartments || [] },
      cgpa: { $gte: Number(drive.minCgpa) || 0 },
      currentArrears: { $lte: Number(drive.maxCurrentArrears ?? 0) },
    };

    if (drive.eligibleBatches && drive.eligibleBatches.length > 0) {
      eligibleQuery.batch = { $in: drive.eligibleBatches };
    }

    if (drive.minTenthMarks && drive.minTenthMarks > 0) {
      eligibleQuery.tenthPercentage = { $gte: Number(drive.minTenthMarks) };
    }

    if (drive.minTwelfthMarks && drive.minTwelfthMarks > 0) {
      eligibleQuery.twelfthPercentage = { $gte: Number(drive.minTwelfthMarks) };
    }

    const eligibleStudents = await Student.find(eligibleQuery)
      .select(
        'name rollNumber department batch cgpa currentArrears historyOfArrears tenthPercentage twelfthPercentage email phone resumeUrl linkedinUrl careerPreference status'
      )
      .sort({ cgpa: -1 });

    res.json({
      drive,
      rounds: drive.rounds || [],
      currentRound: drive.currentRound || 1,
      finalSelectedStudents: drive.finalSelectedStudents || [],
      registeredStudents: drive.registeredStudents || [],
      registeredCount: (drive.registeredStudents || []).length,
      eligibleStudents: eligibleStudents || [],
      eligibleCount: (eligibleStudents || []).length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance selected candidates to next round (e.g. Round 2, Round 3, ... Round N)
// @route   POST /api/drives/:id/rounds/:roundNumber/advance
exports.advanceRoundCandidates = async (req, res, next) => {
  try {
    const { id, roundNumber } = req.params;
    const currentRNum = Number(roundNumber);
    const {
      selectedStudentIds,
      nextRoundNumber,
      nextRoundName,
      scheduledDate,
      venue,
      instructions,
      sendEmail = true,
      customSubject,
      customMessage,
    } = req.body;

    if (!selectedStudentIds || !Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one student to advance to the next round' });
    }

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    const nextRNum = Number(nextRoundNumber) || currentRNum + 1;
    const nextRTitle = nextRoundName?.trim() || `Round ${nextRNum}: Technical Interview`;

    // 1. Update candidates in current round
    const currentRound = drive.rounds.find((r) => r.roundNumber === currentRNum);
    if (currentRound) {
      currentRound.status = 'Completed';
      currentRound.completedAt = new Date();

      const selectedSet = new Set(selectedStudentIds.map(String));
      currentRound.candidates.forEach((cand) => {
        if (selectedSet.has(cand.studentId.toString())) {
          cand.status = 'shortlisted';
        } else if (cand.status === 'pending') {
          cand.status = 'eliminated';
        }
      });
    }

    // 2. Find or create next round
    let nextRound = drive.rounds.find((r) => r.roundNumber === nextRNum);
    if (!nextRound) {
      nextRound = {
        roundNumber: nextRNum,
        name: nextRTitle,
        type: 'Technical Interview',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        venue: venue || 'Campus Lab / Online',
        instructions: instructions || '',
        status: 'In Progress',
        candidates: selectedStudentIds.map((sid) => ({
          studentId: sid,
          status: 'pending',
          emailSent: false,
        })),
      };
      drive.rounds.push(nextRound);
    } else {
      nextRound.name = nextRTitle;
      if (scheduledDate) nextRound.scheduledDate = new Date(scheduledDate);
      if (venue) nextRound.venue = venue;
      if (instructions !== undefined) nextRound.instructions = instructions;
      nextRound.status = 'In Progress';

      // Merge candidates
      const existingCandIds = new Set(nextRound.candidates.map((c) => c.studentId.toString()));
      selectedStudentIds.forEach((sid) => {
        if (!existingCandIds.has(String(sid))) {
          nextRound.candidates.push({
            studentId: sid,
            status: 'pending',
            emailSent: false,
          });
        }
      });
    }

    drive.currentRound = nextRNum;
    await drive.save();

    // 3. Send emails if requested
    let emailResults = [];
    if (sendEmail) {
      const students = await Student.find({ _id: { $in: selectedStudentIds } });
      const nextRoundObj = drive.rounds.find((r) => r.roundNumber === nextRNum);

      for (const student of students) {
        const sendRes = await sendRoundShortlistEmail({
          student,
          drive,
          roundName: nextRTitle,
          roundNumber: nextRNum,
          scheduledDate: scheduledDate || nextRoundObj?.scheduledDate,
          venue: venue || nextRoundObj?.venue,
          instructions: instructions || nextRoundObj?.instructions,
          customSubject,
          customMessage,
        });

        emailResults.push(sendRes);

        // Mark candidate emailSent
        if (nextRoundObj && sendRes.success) {
          const cand = nextRoundObj.candidates.find(
            (c) => c.studentId.toString() === student._id.toString()
          );
          if (cand) {
            cand.emailSent = true;
            cand.emailSentAt = new Date();
          }
        }
      }

      await drive.save();
    }

    // Refetch populated drive
    const updatedDrive = await Drive.findById(id)
      .populate('companyId')
      .populate({
        path: 'registeredStudents',
        select:
          'name rollNumber department batch cgpa currentArrears historyOfArrears tenthPercentage twelfthPercentage email phone resumeUrl linkedinUrl careerPreference status',
      })
      .populate({
        path: 'rounds.candidates.studentId',
        select:
          'name rollNumber department batch cgpa currentArrears historyOfArrears tenthPercentage twelfthPercentage email phone resumeUrl linkedinUrl careerPreference status',
      })
      .populate({
        path: 'finalSelectedStudents.studentId',
        select: 'name rollNumber department batch cgpa currentArrears email phone resumeUrl careerPreference status',
      })
      .populate('finalSelectedStudents.placementId');

    const successfulEmails = emailResults.filter((e) => e.success).length;

    res.json({
      message: `Successfully advanced ${selectedStudentIds.length} candidate(s) to ${nextRTitle}!${sendEmail ? ` Notification emails sent to ${successfulEmails} candidate(s).` : ''}`,
      drive: updatedDrive,
      emailResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Select candidates for final placement offers at the company
// @route   POST /api/drives/:id/select-final
exports.selectFinalCandidates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      selectedStudentIds,
      currentRoundNumber,
      role,
      package: pkg,
      placementDate,
      sendEmail = true,
      customSubject,
      customMessage,
    } = req.body;

    if (!selectedStudentIds || !Array.isArray(selectedStudentIds) || selectedStudentIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one student for final selection' });
    }

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    const company = await Company.findById(drive.companyId);

    const placedRole = role?.trim() || drive.role;
    const placedPackage = Number(pkg) || drive.package;
    const pDate = placementDate ? new Date(placementDate) : new Date();

    const createdPlacements = [];
    const studentsToEmail = [];

    for (const studentId of selectedStudentIds) {
      const student = await Student.findById(studentId);
      if (!student) continue;

      // Check if already in finalSelectedStudents
      const alreadySelected = drive.finalSelectedStudents.some(
        (f) => f.studentId.toString() === student._id.toString()
      );

      let placementId = student.placementId;

      if (!alreadySelected) {
        // Create placement record
        const placement = await Placement.create({
          studentId: student._id,
          companyId: drive.companyId,
          role: placedRole,
          package: placedPackage,
          placementDate: pDate,
          offerType: 'on_campus',
          status: 'offered',
        });

        placementId = placement._id;
        createdPlacements.push(placement);

        // Update student status to placed
        student.status = 'placed';
        student.placementId = placement._id;
        await student.save();

        // Increment company placed count
        if (company) {
          company.studentsPlaced = (company.studentsPlaced || 0) + 1;
          await company.save();
        }

        // Create alumni record
        const gradYear = student.batch.includes('-')
          ? student.batch.split('-')[1]
          : student.batch;

        await Alumni.create({
          studentId: student._id,
          placementId: placement._id,
          companyId: drive.companyId,
          currentCompany: drive.companyName,
          currentRole: placedRole,
          graduationYear: gradYear,
          department: student.department,
        });

        drive.finalSelectedStudents.push({
          studentId: student._id,
          role: placedRole,
          package: placedPackage,
          placementDate: pDate,
          placementId: placement._id,
          emailSent: false,
        });
      }

      // Mark candidate as 'selected' in the specified or current round
      if (currentRoundNumber) {
        const round = drive.rounds.find((r) => r.roundNumber === Number(currentRoundNumber));
        if (round) {
          const cand = round.candidates.find(
            (c) => c.studentId.toString() === student._id.toString()
          );
          if (cand) cand.status = 'selected';
        }
      }

      studentsToEmail.push(student);
    }

    // If drive status was Ongoing, and final candidates selected, consider marking completed if desired
    await drive.save();

    // Send emails if requested
    let emailResults = [];
    if (sendEmail) {
      for (const student of studentsToEmail) {
        const sendRes = await sendFinalSelectionEmail({
          student,
          drive,
          role: placedRole,
          package: placedPackage,
          customSubject,
          customMessage,
        });

        emailResults.push(sendRes);

        if (sendRes.success) {
          const finalItem = drive.finalSelectedStudents.find(
            (f) => f.studentId.toString() === student._id.toString()
          );
          if (finalItem) {
            finalItem.emailSent = true;
            finalItem.emailSentAt = new Date();
          }
        }
      }

      await drive.save();
    }

    // Refetch populated drive
    const updatedDrive = await Drive.findById(id)
      .populate('companyId')
      .populate({
        path: 'registeredStudents',
        select:
          'name rollNumber department batch cgpa currentArrears historyOfArrears tenthPercentage twelfthPercentage email phone resumeUrl linkedinUrl careerPreference status',
      })
      .populate({
        path: 'rounds.candidates.studentId',
        select:
          'name rollNumber department batch cgpa currentArrears historyOfArrears tenthPercentage twelfthPercentage email phone resumeUrl linkedinUrl careerPreference status',
      })
      .populate({
        path: 'finalSelectedStudents.studentId',
        select: 'name rollNumber department batch cgpa currentArrears email phone resumeUrl careerPreference status',
      })
      .populate('finalSelectedStudents.placementId');

    const successfulEmails = emailResults.filter((e) => e.success).length;

    res.json({
      message: `🎉 Successfully selected ${selectedStudentIds.length} student(s) for ${drive.companyName}! Official placement records generated.${sendEmail ? ` Offer congratulation emails sent to ${successfulEmails} student(s).` : ''}`,
      drive: updatedDrive,
      emailResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update a recruitment round for a drive (Admin)
// @route   POST /api/drives/:id/rounds
exports.addOrUpdateRound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roundNumber, name, type, scheduledDate, venue, instructions, status } = req.body;

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    const rNum = Number(roundNumber) || drive.rounds.length + 1;
    let round = drive.rounds.find((r) => r.roundNumber === rNum);

    if (round) {
      if (name) round.name = name;
      if (type) round.type = type;
      if (scheduledDate !== undefined) round.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
      if (venue) round.venue = venue;
      if (instructions !== undefined) round.instructions = instructions;
      if (status) round.status = status;
    } else {
      round = {
        roundNumber: rNum,
        name: name || `Round ${rNum}`,
        type: type || 'Technical Interview',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        venue: venue || 'Campus / Online',
        instructions: instructions || '',
        status: status || 'Upcoming',
        candidates: [],
      };
      drive.rounds.push(round);
    }

    await drive.save();

    res.json({
      message: `Round ${rNum} (${round.name}) configured successfully`,
      round,
      drive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send custom email to selected candidates or round participants
// @route   POST /api/drives/:id/rounds/:roundNumber/send-email
exports.sendCustomRoundEmail = async (req, res, next) => {
  try {
    const { id, roundNumber } = req.params;
    const { studentIds, subject, message: customMessage } = req.body;

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    const round = drive.rounds.find((r) => r.roundNumber === Number(roundNumber));
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const targetStudentIds =
      studentIds && studentIds.length > 0
        ? studentIds
        : round.candidates.map((c) => c.studentId);

    const students = await Student.find({ _id: { $in: targetStudentIds } });

    const emailResults = [];
    for (const student of students) {
      const result = await sendRoundShortlistEmail({
        student,
        drive,
        roundName: round.name,
        roundNumber: round.roundNumber,
        scheduledDate: round.scheduledDate,
        venue: round.venue,
        instructions: round.instructions,
        customSubject: subject,
        customMessage,
      });
      emailResults.push(result);
    }

    res.json({
      message: `Sent emails to ${emailResults.filter((e) => e.success).length} candidate(s)`,
      emailResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend round invitation email to candidate(s)
// @route   POST /api/drives/:id/rounds/:roundNumber/resend-email
exports.resendRoundEmail = async (req, res, next) => {
  try {
    const { id, roundNumber } = req.params;
    const { studentIds, customSubject, customMessage } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please specify at least one student to resend email' });
    }

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    const round = drive.rounds.find((r) => r.roundNumber === Number(roundNumber));
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length === 0) {
      return res.status(404).json({ message: 'Students not found' });
    }

    const emailResults = [];
    for (const student of students) {
      const sendRes = await sendRoundShortlistEmail({
        student,
        drive,
        roundName: round.name,
        roundNumber: round.roundNumber,
        scheduledDate: round.scheduledDate,
        venue: round.venue,
        instructions: round.instructions,
        customSubject,
        customMessage,
      });

      emailResults.push(sendRes);

      if (sendRes.success) {
        const cand = round.candidates.find(
          (c) => c.studentId.toString() === student._id.toString()
        );
        if (cand) {
          cand.emailSent = true;
          cand.emailSentAt = new Date();
        }
      }
    }

    await drive.save();

    const isConfigured = Boolean(
      (process.env.EMAILJS_SERVICE_ID && (process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID)) ||
      (process.env.GMAIL_USER && (process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD)) ||
      (process.env.SMTP_HOST && process.env.SMTP_USER)
    );

    const anyUnconfigured = emailResults.some((e) => e.notConfigured);
    const failedEmails = emailResults.filter((e) => !e.success && !e.notConfigured);
    const successCount = emailResults.filter((e) => e.success).length;

    if (!isConfigured || anyUnconfigured) {
      return res.status(400).json({
        success: false,
        notConfigured: true,
        message: failedEmails[0]?.error || 'Email service not configured in server/.env',
        emailResults,
      });
    }

    if (failedEmails.length > 0 && successCount === 0) {
      return res.status(400).json({
        success: false,
        message: failedEmails[0]?.error || failedEmails[0]?.message || 'Email delivery failed.',
        emailResults,
      });
    }

    res.json({
      success: true,
      message: `Successfully delivered invitation email to ${successCount} student(s)!`,
      emailResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend final placement offer congratulations email
// @route   POST /api/drives/:id/resend-offer-email
exports.resendOfferEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentIds, customSubject, customMessage } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please specify at least one student' });
    }

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({ message: 'Placement drive not found' });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    const emailResults = [];

    for (const student of students) {
      const finalEntry = drive.finalSelectedStudents.find(
        (f) => f.studentId.toString() === student._id.toString()
      );

      const sendRes = await sendFinalSelectionEmail({
        student,
        drive,
        role: finalEntry?.role || drive.role,
        package: finalEntry?.package || drive.package,
        customSubject,
        customMessage,
      });

      emailResults.push(sendRes);

      if (sendRes.success && finalEntry) {
        finalEntry.emailSent = true;
        finalEntry.emailSentAt = new Date();
      }
    }

    await drive.save();

    const isConfigured = Boolean(
      (process.env.EMAILJS_SERVICE_ID && (process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID)) ||
      (process.env.GMAIL_USER && (process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD)) ||
      (process.env.SMTP_HOST && process.env.SMTP_USER)
    );

    const anyUnconfigured = emailResults.some((e) => e.notConfigured);
    const failedEmails = emailResults.filter((e) => !e.success && !e.notConfigured);
    const successCount = emailResults.filter((e) => e.success).length;

    if (!isConfigured || anyUnconfigured) {
      return res.status(400).json({
        success: false,
        notConfigured: true,
        message: failedEmails[0]?.error || 'Email service credentials not configured in server/.env',
        emailResults,
      });
    }

    if (failedEmails.length > 0 && successCount === 0) {
      return res.status(400).json({
        success: false,
        message: failedEmails[0]?.error || failedEmails[0]?.message || 'Failed to deliver offer email.',
        emailResults,
      });
    }

    res.json({
      success: true,
      message: `Successfully delivered offer congratulations email to ${successCount} student(s)!`,
      emailResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get email configuration status
// @route   GET /api/drives/email-config
exports.getEmailConfig = async (req, res, next) => {
  try {
    const hasGmail = Boolean(process.env.GMAIL_USER && (process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD));
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    res.json({
      configured: hasGmail || hasSmtp,
      service: hasGmail ? 'Gmail' : hasSmtp ? 'Custom SMTP' : 'Unconfigured',
      senderEmail: process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_FROM || '',
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save email configuration and send test email
// @route   POST /api/drives/email-config
exports.saveEmailConfig = async (req, res, next) => {
  try {
    const { gmailUser, gmailPass, smtpHost, smtpPort, smtpUser, smtpPass, emailFrom, testRecipient } = req.body;

    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(__dirname, '../../.env');

    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    const setEnvKey = (key, val) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (val !== undefined && val !== null && val !== '') {
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${val}`);
        } else {
          envContent += `\n${key}=${val}`;
        }
        process.env[key] = val;
      } else if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=`);
        delete process.env[key];
      }
    };

    if (gmailUser !== undefined) setEnvKey('GMAIL_USER', gmailUser.trim());
    if (gmailPass !== undefined) {
      const cleanedPass = gmailPass.trim().replace(/\s+/g, '');
      setEnvKey('GMAIL_PASS', cleanedPass);
      setEnvKey('GMAIL_APP_PASSWORD', cleanedPass);
    }
    if (smtpHost !== undefined) setEnvKey('SMTP_HOST', smtpHost.trim());
    if (smtpPort !== undefined) setEnvKey('SMTP_PORT', smtpPort.trim());
    if (smtpUser !== undefined) setEnvKey('SMTP_USER', smtpUser.trim());
    if (smtpPass !== undefined) setEnvKey('SMTP_PASS', smtpPass.trim());
    if (emailFrom !== undefined) setEnvKey('EMAIL_FROM', emailFrom.trim());

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    // Reset transporter cache
    resetTransporter();

    let testResult = null;
    if (testRecipient && testRecipient.trim()) {
      testResult = await sendTestEmail(testRecipient.trim());
    }

    if (testResult && !testResult.success) {
      return res.status(400).json({
        message: `Gmail test verification failed: ${testResult.error || 'Authentication failed'}. Please verify your Gmail address and 16-character Google App Password.`,
        testResult,
      });
    }

    res.json({
      message: testResult?.success
        ? `✅ Email settings saved and test email successfully delivered to ${testRecipient.trim()}!`
        : '✅ Email configuration saved successfully!',
      testResult,
    });
  } catch (error) {
    next(error);
  }
};
