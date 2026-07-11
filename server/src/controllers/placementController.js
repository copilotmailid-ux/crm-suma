const Placement = require('../models/Placement');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Alumni = require('../models/Alumni');

// @desc    Get all placements with filters
// @route   GET /api/placements
exports.getPlacements = async (req, res, next) => {
  try {
    const { companyId, department, batch, offerType, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (companyId) query.companyId = companyId;
    if (offerType) query.offerType = offerType;
    if (status) query.status = status;

    // Build pipeline for department/batch filter (requires join with Student)
    let placements;
    let total;

    if (department || batch) {
      const studentQuery = {};
      if (department) studentQuery.department = department;
      if (batch) studentQuery.batch = batch;

      const studentIds = await Student.find(studentQuery).distinct('_id');
      query.studentId = { $in: studentIds };
    }

    total = await Placement.countDocuments(query);
    placements = await Placement.find(query)
      .populate('studentId', 'name rollNumber department batch email')
      .populate('companyId', 'name industry')
      .sort({ placementDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      placements,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single placement
// @route   GET /api/placements/:id
exports.getPlacement = async (req, res, next) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate('studentId')
      .populate('companyId');

    if (!placement) {
      res.status(404);
      throw new Error('Placement not found');
    }

    res.json(placement);
  } catch (error) {
    next(error);
  }
};

// @desc    Create placement (also updates student status + creates alumni)
// @route   POST /api/placements
exports.createPlacement = async (req, res, next) => {
  try {
    const { studentId, companyId, role, package: pkg, placementDate, offerType, status } = req.body;

    // Check student exists
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404);
      throw new Error('Student not found');
    }

    // Check company exists
    const company = await Company.findById(companyId);
    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    // Create placement
    const placement = await Placement.create({
      studentId,
      companyId,
      role,
      package: pkg,
      placementDate,
      offerType: offerType || 'on_campus',
      status: status || 'offered',
    });

    // Update student status
    student.status = 'placed';
    student.placementId = placement._id;
    await student.save();

    // Increment company placed count
    company.studentsPlaced = (company.studentsPlaced || 0) + 1;
    await company.save();

    // Extract graduation year from batch (e.g., "2022-2026" → "2026")
    const gradYear = student.batch.includes('-')
      ? student.batch.split('-')[1]
      : student.batch;

    // Create alumni record
    await Alumni.create({
      studentId: student._id,
      placementId: placement._id,
      companyId: company._id,
      currentCompany: company.name,
      currentRole: role,
      graduationYear: gradYear,
      department: student.department,
    });

    const populatedPlacement = await Placement.findById(placement._id)
      .populate('studentId', 'name rollNumber department batch')
      .populate('companyId', 'name industry');

    res.status(201).json(populatedPlacement);
  } catch (error) {
    next(error);
  }
};

// @desc    Update placement
// @route   PUT /api/placements/:id
exports.updatePlacement = async (req, res, next) => {
  try {
    const placement = await Placement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('studentId', 'name rollNumber department batch')
      .populate('companyId', 'name industry');

    if (!placement) {
      res.status(404);
      throw new Error('Placement not found');
    }

    res.json(placement);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete placement (reverts student status)
// @route   DELETE /api/placements/:id
exports.deletePlacement = async (req, res, next) => {
  try {
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
      res.status(404);
      throw new Error('Placement not found');
    }

    // Revert student status
    await Student.findByIdAndUpdate(placement.studentId, {
      status: 'not_placed',
      placementId: null,
    });

    // Decrement company count
    await Company.findByIdAndUpdate(placement.companyId, {
      $inc: { studentsPlaced: -1 },
    });

    // Remove alumni record
    await Alumni.findOneAndDelete({ placementId: placement._id });

    await Placement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Placement deleted successfully' });
  } catch (error) {
    next(error);
  }
};
