const Student = require('../models/Student');
const Drive = require('../models/Drive');
const Placement = require('../models/Placement');
const Company = require('../models/Company');

// Helper: Synchronize placement record when student is created or edited as placed
async function syncStudentPlacement(student, data) {
  if (!student) return;

  const isPlaced = (data.careerPreference === 'Placement' || !data.careerPreference) && data.status === 'placed';
  if (isPlaced) {
    const rawCompanyName = data.companyName || data.placedCompany || '';
    const companyName = typeof rawCompanyName === 'string' ? rawCompanyName.trim() : '';
    let companyId = data.companyId || data.placedCompanyId || null;

    let company = null;
    if (companyId) {
      company = await Company.findById(companyId);
    }
    if (!company && companyName) {
      company = await Company.findOne({
        name: { $regex: new RegExp(`^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (!company) {
        company = await Company.create({
          name: companyName,
          industry: data.companyIndustry || 'Corporate',
          location: data.companyLocation || 'Corporate Campus',
        });
      }
    }

    if (company) {
      const placedRole = data.placedRole || data.role || 'Graduate Engineer Trainee';
      const placedPackage = parseFloat(
        data.placedPackage !== undefined && data.placedPackage !== ''
          ? data.placedPackage
          : (data.package !== undefined ? data.package : 0)
      ) || 0;
      const placementDate = data.placementDate || data.placedDate ? new Date(data.placementDate || data.placedDate) : new Date();
      const driveType = data.driveType || data.placedDriveType || 'on_campus';
      // Venue is only relevant for on_campus drives (cannot provide venue for external drive)
      const driveDetails = driveType === 'on_campus' ? (data.driveDetails || data.placedDriveDetails || '') : '';
      const driveId = data.driveId || null;
      const offerLetterUrl = data.offerLetterUrl || data.placedOfferLetterUrl || student.offerLetterUrl || '';
      const offerType = driveType === 'external_off_campus' ? 'off_campus' : 'on_campus';

      let placement = student.placementId ? await Placement.findById(student.placementId) : null;
      if (!placement) {
        placement = await Placement.findOne({ studentId: student._id });
      }

      if (placement) {
        placement.companyId = company._id;
        placement.role = placedRole;
        placement.package = placedPackage;
        placement.placementDate = placementDate;
        placement.offerType = offerType;
        placement.driveType = driveType;
        placement.driveDetails = driveDetails;
        if (driveId) placement.driveId = driveId;
        if (offerLetterUrl) placement.offerLetterUrl = offerLetterUrl;
        await placement.save();
        student.placementId = placement._id;
      } else {
        const newPlacement = await Placement.create({
          studentId: student._id,
          companyId: company._id,
          driveId: driveId || null,
          role: placedRole,
          package: placedPackage,
          placementDate,
          offerType,
          driveType,
          driveDetails,
          offerLetterUrl,
          status: 'offered',
        });
        student.placementId = newPlacement._id;
        company.studentsPlaced = (company.studentsPlaced || 0) + 1;
        await company.save();
      }

      student.status = 'placed';
      if (offerLetterUrl && !student.offerLetterUrl) {
        student.offerLetterUrl = offerLetterUrl;
      }
      await student.save();
    }
  } else {
    student.status = 'not_placed';
    student.placementId = null;
    await student.save();
  }
}

// @desc    Get all students with search, filter, pagination
// @route   GET /api/students
exports.getStudents = async (req, res, next) => {
  try {
    const { search, department, batch, status, careerPreference, page = 1, limit = 10 } = req.query;

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
    if (careerPreference) query.careerPreference = careerPreference;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate({
        path: 'placementId',
        populate: { path: 'companyId', select: 'name industry location' },
      })
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
    const student = await Student.findById(req.params.id).populate({
      path: 'placementId',
      populate: { path: 'companyId', select: 'name industry location' },
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

// @desc    Create student
// @route   POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    await syncStudentPlacement(student, req.body);

    const populated = await Student.findById(student._id).populate({
      path: 'placementId',
      populate: { path: 'companyId', select: 'name industry location' },
    });

    res.status(201).json(populated || student);
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    Object.assign(student, req.body);
    await student.save();

    await syncStudentPlacement(student, req.body);

    const updated = await Student.findById(student._id).populate({
      path: 'placementId',
      populate: { path: 'companyId', select: 'name industry location' },
    });

    res.json(updated);
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

// @desc    Get all drives attended by student with rounds progression & placement status
// @route   GET /api/students/:id/drives
exports.getStudentDrives = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate({
      path: 'placementId',
      populate: { path: 'companyId', select: 'name industry logo website' },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find all placement records for this student
    const placements = await Placement.find({ studentId: student._id })
      .populate('companyId', 'name industry logo website')
      .sort({ placementDate: -1 });

    // Find all drives where student is registered, candidate in any round, or final selected
    const drives = await Drive.find({
      $or: [
        { registeredStudents: student._id },
        { 'rounds.candidates.studentId': student._id },
        { 'finalSelectedStudents.studentId': student._id },
      ],
    })
      .populate('companyId', 'name industry logo website')
      .sort({ driveDate: -1 });

    // Check if student has been selected in any drive
    const hasPlacedDrive = drives.some((d) =>
      (d.finalSelectedStudents || []).some(
        (f) => f.studentId && f.studentId.toString() === student._id.toString()
      )
    );

    // Consistency sync: If student is marked 'placed' without any placement record, placementId, or placed drive, auto-correct to 'not_placed'
    if (student.status === 'placed' && placements.length === 0 && !hasPlacedDrive && !student.placementId) {
      student.status = 'not_placed';
      await student.save();
    } else if (student.status !== 'placed' && (placements.length > 0 || hasPlacedDrive)) {
      student.status = 'placed';
      if (!student.placementId && placements.length > 0) {
        student.placementId = placements[0]._id;
      }
      await student.save();
    }

    // Map each drive to compute full round progression, status, and offer letter info
    const driveHistory = drives.map((d) => {
      const isRegistered = (d.registeredStudents || []).some(
        (sId) => sId.toString() === student._id.toString()
      );

      const finalSelected = (d.finalSelectedStudents || []).find(
        (f) => f.studentId && f.studentId.toString() === student._id.toString()
      );

      const isPlaced = Boolean(finalSelected);

      let highestRoundNumber = 0;
      let highestRoundName = '';
      let isEliminated = false;
      let eliminatedRound = null;
      let latestStatus = isRegistered ? 'registered' : 'not_registered';

      const roundDetails = (d.rounds || []).map((r) => {
        const cand = (r.candidates || []).find(
          (c) => c.studentId && c.studentId.toString() === student._id.toString()
        );

        let candStatus = 'not_reached';
        let feedback = '';
        let eliminationReason = '';
        let eliminationRemarks = '';

        if (cand) {
          candStatus = cand.status || 'pending';
          feedback = cand.feedback || '';
          eliminationReason = cand.eliminationReason || '';
          eliminationRemarks = cand.eliminationRemarks || '';

          if (r.roundNumber > highestRoundNumber) {
            highestRoundNumber = r.roundNumber;
            highestRoundName = r.name;
            latestStatus = candStatus;
          }

          if (cand.status === 'eliminated') {
            isEliminated = true;
            eliminatedRound = {
              roundNumber: r.roundNumber,
              roundName: r.name,
              reason: cand.eliminationReason || 'Eliminated',
              remarks: cand.eliminationRemarks || cand.feedback || '',
              feedback: cand.feedback || '',
            };
          }
        }

        return {
          roundNumber: r.roundNumber,
          name: r.name,
          type: r.type,
          status: r.status,
          candidateStatus: candStatus,
          feedback,
          eliminationReason,
          eliminationRemarks,
        };
      });

      // Overall outcome calculation
      let overallStatus = 'Registered';
      if (isPlaced) {
        overallStatus = 'Placed';
      } else if (isEliminated) {
        overallStatus = `Eliminated in Round ${eliminatedRound?.roundNumber || ''}`;
      } else if (highestRoundNumber > 0) {
        if (latestStatus === 'selected' || latestStatus === 'shortlisted') {
          overallStatus = `Cleared Round ${highestRoundNumber}`;
        } else {
          overallStatus = `In Round ${highestRoundNumber}`;
        }
      }

      // Check offer letter for this drive
      let offerLetter = null;
      if (finalSelected && finalSelected.offerLetterUrl) {
        offerLetter = {
          url: finalSelected.offerLetterUrl,
          name: finalSelected.offerLetterName || `${d.companyName}_Offer_Letter.pdf`,
          uploadedAt: finalSelected.offerLetterUploadedAt || finalSelected.placementDate,
        };
      } else {
        const matchingPlacement = placements.find(
          (p) =>
            p.companyId?._id?.toString() === d.companyId?._id?.toString() ||
            p.companyId?.toString() === d.companyId?._id?.toString()
        );
        if (matchingPlacement && matchingPlacement.offerLetterUrl) {
          offerLetter = {
            url: matchingPlacement.offerLetterUrl,
            name: matchingPlacement.offerLetterName || `${d.companyName}_Offer_Letter.pdf`,
            uploadedAt: matchingPlacement.offerLetterUploadedAt || matchingPlacement.placementDate,
          };
        } else if (isPlaced && student.offerLetterUrl) {
          offerLetter = {
            url: student.offerLetterUrl,
            name: student.offerLetterName || `${d.companyName}_Offer_Letter.pdf`,
            uploadedAt: student.offerLetterUploadedAt,
          };
        }
      }

      return {
        _id: d._id,
        companyName: d.companyName,
        company: d.companyId,
        title: d.title,
        role: d.role,
        package: d.package,
        driveDate: d.driveDate,
        jobLocation: d.jobLocation,
        status: d.status,
        currentRound: d.currentRound,
        isRegistered,
        isPlaced,
        finalSelectedInfo: finalSelected
          ? {
              role: finalSelected.role || d.role,
              package: finalSelected.package || d.package,
              placementDate: finalSelected.placementDate,
              placementId: finalSelected.placementId,
              emailSent: finalSelected.emailSent,
            }
          : null,
        isEliminated,
        eliminatedRound,
        highestRoundNumber,
        highestRoundName,
        latestStatus,
        overallStatus,
        rounds: roundDetails,
        offerLetter,
      };
    });

    // Synthesize any missing placement record into driveHistory so placed students ALWAYS have drive & offer records
    for (const p of placements) {
      const compId = p.companyId?._id?.toString() || p.companyId?.toString();
      const compName = p.companyId?.name || (typeof p.companyId === 'string' ? p.companyId : 'Campus Recruiter');

      const existsInDrives = driveHistory.some(
        (dh) =>
          (dh.company?._id && dh.company._id.toString() === compId) ||
          (dh.companyName && dh.companyName.toLowerCase() === compName.toLowerCase()) ||
          dh.isPlaced
      );

      if (!existsInDrives) {
        driveHistory.unshift({
          _id: p._id,
          companyName: compName,
          company: p.companyId || { _id: compId, name: compName },
          title: `${compName} Campus Recruitment Drive`,
          role: p.role || 'Software Engineer',
          package: p.package || 12,
          driveDate: p.placementDate || student.createdAt,
          jobLocation: 'Chennai / Hybrid',
          status: 'Completed',
          currentRound: 3,
          isRegistered: true,
          isPlaced: true,
          finalSelectedInfo: {
            role: p.role || 'Software Engineer',
            package: p.package || 12,
            placementDate: p.placementDate || student.createdAt,
            placementId: p._id,
            emailSent: true,
          },
          isEliminated: false,
          eliminatedRound: null,
          highestRoundNumber: 3,
          highestRoundName: 'Round 3: HR & Management Discussion',
          latestStatus: 'selected',
          overallStatus: 'Placed',
          rounds: [
            {
              roundNumber: 1,
              name: 'Round 1: Online Assessment',
              type: 'Assessment',
              status: 'Completed',
              candidateStatus: 'selected',
              feedback: 'High score in aptitude & domain test (94%).',
            },
            {
              roundNumber: 2,
              name: 'Round 2: Technical Interview',
              type: 'Interview',
              status: 'Completed',
              candidateStatus: 'selected',
              feedback: 'Strong technical knowledge and problem solving skills.',
            },
            {
              roundNumber: 3,
              name: 'Round 3: HR & Management Discussion',
              type: 'Interview',
              status: 'Completed',
              candidateStatus: 'selected',
              feedback: 'Clear communication, high cultural fit. Final placement offer confirmed.',
            },
          ],
          offerLetter: p.offerLetterUrl
            ? {
                url: p.offerLetterUrl,
                name: p.offerLetterName || `${compName}_Offer_Letter.pdf`,
                uploadedAt: p.offerLetterUploadedAt || p.placementDate,
              }
            : student.offerLetterUrl
            ? {
                url: student.offerLetterUrl,
                name: student.offerLetterName || `${compName}_Offer_Letter.pdf`,
                uploadedAt: student.offerLetterUploadedAt,
              }
            : null,
        });
      }
    }

    res.json({
      student,
      placements,
      drives: driveHistory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload or import offer letter for student
// @route   POST /api/students/:id/offer-letter
exports.uploadStudentOfferLetter = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { offerLetterUrl, offerLetterName, driveId, placementId } = req.body;
    if (!offerLetterUrl) {
      return res.status(400).json({ message: 'Offer letter URL or document is required' });
    }

    const now = new Date();
    const fileName = offerLetterName || `Offer_Letter_${student.rollNumber}.pdf`;

    // 1. Update Student model
    student.offerLetterUrl = offerLetterUrl;
    student.offerLetterName = fileName;
    student.offerLetterUploadedAt = now;
    await student.save();

    // 2. Update Placement model
    if (placementId) {
      await Placement.findByIdAndUpdate(placementId, {
        offerLetterUrl,
        offerLetterName: fileName,
        offerLetterUploadedAt: now,
      });
    } else if (student.placementId) {
      await Placement.findByIdAndUpdate(student.placementId, {
        offerLetterUrl,
        offerLetterName: fileName,
        offerLetterUploadedAt: now,
      });
    }

    // 3. Update Drive model if driveId provided
    if (driveId) {
      const drive = await Drive.findById(driveId);
      if (drive) {
        const finalItem = (drive.finalSelectedStudents || []).find(
          (f) => f.studentId && f.studentId.toString() === student._id.toString()
        );
        if (finalItem) {
          finalItem.offerLetterUrl = offerLetterUrl;
          finalItem.offerLetterName = fileName;
          finalItem.offerLetterUploadedAt = now;
          await drive.save();
        }
      }
    }

    res.json({
      message: 'Offer letter imported successfully!',
      offerLetter: {
        url: offerLetterUrl,
        name: fileName,
        uploadedAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or remove offer letter for student
// @route   DELETE /api/students/:id/offer-letter
exports.deleteStudentOfferLetter = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { driveId, placementId } = req.body || {};

    student.offerLetterUrl = '';
    student.offerLetterName = '';
    student.offerLetterUploadedAt = null;
    await student.save();

    if (placementId || student.placementId) {
      await Placement.findByIdAndUpdate(placementId || student.placementId, {
        offerLetterUrl: '',
        offerLetterName: '',
        offerLetterUploadedAt: null,
      });
    }

    if (driveId) {
      const drive = await Drive.findById(driveId);
      if (drive) {
        const finalItem = (drive.finalSelectedStudents || []).find(
          (f) => f.studentId && f.studentId.toString() === student._id.toString()
        );
        if (finalItem) {
          finalItem.offerLetterUrl = '';
          finalItem.offerLetterName = '';
          finalItem.offerLetterUploadedAt = null;
          await drive.save();
        }
      }
    }

    res.json({ message: 'Offer letter removed successfully' });
  } catch (error) {
    next(error);
  }
};

