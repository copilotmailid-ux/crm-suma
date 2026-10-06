const Drive = require('../models/Drive');
const Company = require('../models/Company');

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
      .populate('registeredStudents', 'name rollNumber department batch cgpa email phone resumeUrl');

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
      driveDate: driveDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      registrationDeadline: registrationDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: status || 'Upcoming',
      jobDescription: jobDescription || '',
      selectionProcess: selectionProcess || 'Round 1: Online Assessment, Round 2: Technical Interview, Round 3: HR Interview',
      applicationLink: applicationLink || '',
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
    await drive.save();

    res.json({
      message: `Successfully registered for ${drive.companyName} placement drive!`,
      registered: true,
    });
  } catch (error) {
    next(error);
  }
};
