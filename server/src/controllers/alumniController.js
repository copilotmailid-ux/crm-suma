const Alumni = require('../models/Alumni');
const Student = require('../models/Student');

// @desc    Get all alumni with filters
// @route   GET /api/alumni
exports.getAlumni = async (req, res, next) => {
  try {
    const { search, department, graduationYear, companyId, filterType, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { currentCompany: { $regex: search, $options: 'i' } },
        { currentRole: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) query.department = department;
    if (graduationYear) query.graduationYear = graduationYear;
    if (companyId) query.companyId = companyId;

    if (filterType === 'shifted') {
      query.companyShifted = true;
    } else if (filterType === 'normal') {
      query.companyShifted = { $ne: true };
    }

    const total = await Alumni.countDocuments(query);
    const alumni = await Alumni.find(query)
      .populate('studentId', 'name rollNumber email phone department batch')
      .populate('companyId', 'name industry')
      .populate('placementId', 'role package placementDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      alumni,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single alumni
// @route   GET /api/alumni/:id
exports.getAlumniById = async (req, res, next) => {
  try {
    const alumni = await Alumni.findById(req.params.id)
      .populate('studentId')
      .populate('companyId')
      .populate('placementId');

    if (!alumni) {
      res.status(404);
      throw new Error('Alumni not found');
    }

    res.json(alumni);
  } catch (error) {
    next(error);
  }
};

// @desc    Update alumni
// @route   PUT /api/alumni/:id
exports.updateAlumni = async (req, res, next) => {
  try {
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      res.status(404);
      throw new Error('Alumni not found');
    }

    // Check for company/role changes to record in history
    const companyChanged = req.body.currentCompany !== undefined && req.body.currentCompany !== alumni.currentCompany;
    const roleChanged = req.body.currentRole !== undefined && req.body.currentRole !== alumni.currentRole;

    if ((companyChanged || roleChanged) && alumni.currentCompany) {
      alumni.companyHistory.push({
        company: alumni.currentCompany,
        role: alumni.currentRole,
        changedAt: new Date()
      });
    }

    // Update alumni fields
    if (req.body.currentCompany !== undefined) alumni.currentCompany = req.body.currentCompany;
    if (req.body.currentRole !== undefined) alumni.currentRole = req.body.currentRole;
    if (req.body.linkedIn !== undefined) alumni.linkedIn = req.body.linkedIn;
    if (req.body.isActive !== undefined) alumni.isActive = req.body.isActive;

    // Recalculate companyShifted status
    const populatedRecordForCheck = await alumni.populate('companyId');
    if (populatedRecordForCheck.companyId) {
      const originalCompanyName = populatedRecordForCheck.companyId.name || '';
      alumni.companyShifted = alumni.currentCompany.trim().toLowerCase() !== originalCompanyName.trim().toLowerCase();
    }

    await alumni.save();

    // Update phone number and email on associated student if provided
    const studentUpdate = {};
    if (req.body.phone !== undefined) {
      studentUpdate.phone = req.body.phone;
    }
    if (req.body.email !== undefined) {
      studentUpdate.email = req.body.email;
    }
    if (Object.keys(studentUpdate).length > 0) {
      await Student.findByIdAndUpdate(alumni.studentId, studentUpdate, { runValidators: true });
    }

    // Return populated alumni
    const populatedAlumni = await Alumni.findById(alumni._id)
      .populate('studentId', 'name rollNumber email phone department batch')
      .populate('companyId', 'name industry')
      .populate('placementId', 'role package placementDate');

    res.json(populatedAlumni);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete alumni
// @route   DELETE /api/alumni/:id
exports.deleteAlumni = async (req, res, next) => {
  try {
    const alumni = await Alumni.findById(req.params.id);

    if (!alumni) {
      res.status(404);
      throw new Error('Alumni not found');
    }

    await Alumni.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alumni record deleted successfully' });
  } catch (error) {
    next(error);
  }
};
