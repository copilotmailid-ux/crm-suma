const Company = require('../models/Company');
const Drive = require('../models/Drive');
const Placement = require('../models/Placement');
const Student = require('../models/Student');

// @desc    Get all companies with search and filter
// @route   GET /api/companies
exports.getCompanies = async (req, res, next) => {
  try {
    const { search, industry, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }

    if (industry) query.industry = industry;

    const total = await Company.countDocuments(query);
    const rawCompanies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Compute visits (drives count) and placed count for each company
    const companies = await Promise.all(
      rawCompanies.map(async (c) => {
        const [driveCount, placementsCount] = await Promise.all([
          Drive.countDocuments({
            $or: [{ companyId: c._id }, { companyName: new RegExp(`^${c.name}$`, 'i') }],
          }),
          Placement.countDocuments({ companyId: c._id }),
        ]);

        const actualVisits = driveCount > 0 ? driveCount : c.visits || 1;
        const actualPlaced = placementsCount > 0 ? placementsCount : c.studentsPlaced || 0;

        return {
          ...c,
          visits: actualVisits,
          studentsPlaced: actualPlaced,
        };
      })
    );

    res.json({
      companies,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies (no pagination, for dropdowns)
// @route   GET /api/companies/all
exports.getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

function getDeptYearLabel(student) {
  if (!student) return '-';
  const dept = (student.department || '').toUpperCase().trim();
  const dLabel = dept === 'AIDS' || dept === 'AI&DS' || dept === 'AI-DS' ? 'AI&DS' : dept;
  const batch = (student.batch || '').trim();
  const roll = (student.rollNumber || '').toUpperCase().trim();

  // Roman numerals for Year of study: IV (4th year), III (3rd year), II (2nd year), I (1st year)
  let yearRoman = 'IV';
  if (batch.includes('2021') || roll.startsWith('21')) yearRoman = 'IV';
  else if (batch.includes('2022') || roll.startsWith('22')) yearRoman = 'IV';
  else if (batch.includes('2023') || roll.startsWith('23')) yearRoman = 'III';
  else if (batch.includes('2024') || roll.startsWith('24')) yearRoman = 'II';
  else if (batch.includes('2025') || roll.startsWith('25')) yearRoman = 'I';

  return `${yearRoman}-${dLabel}`;
}

// @desc    Get single company with full placed and attended students details
// @route   GET /api/companies/:id
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    // 1. Fetch all placements for this company
    const placements = await Placement.find({ companyId: company._id })
      .populate('studentId', 'name rollNumber department batch cgpa email phone resumeUrl status')
      .sort({ placementDate: -1 });

    const placementById = new Map();
    placements.forEach((p) => {
      if (p._id) {
        placementById.set(p._id.toString(), p);
      }
    });

    // 2. Fetch all drives for this company
    const drives = await Drive.find({
      $or: [
        { companyId: company._id },
        { companyName: new RegExp(`^${company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    })
      .populate('registeredStudents', 'name rollNumber department batch cgpa email phone resumeUrl status')
      .populate('rounds.candidates.studentId', 'name rollNumber department batch cgpa email phone')
      .populate('finalSelectedStudents.studentId', 'name rollNumber department batch cgpa email phone')
      .sort({ driveDate: -1 });

    // 3. Collect Placed Students (from Placements & Drive finalSelectedStudents)
    const placedMap = new Map();
    placements.forEach((p) => {
      if (p.studentId && p.studentId._id) {
        const sId = p.studentId._id.toString();
        const vNum = Number(p.visitNumber) || 1;
        const key = `${sId}_${vNum}`;
        placedMap.set(key, {
          _id: p.studentId._id,
          placementId: p._id,
          name: p.studentId.name,
          rollNumber: p.studentId.rollNumber,
          department: p.studentId.department,
          batch: p.studentId.batch,
          deptYearLabel: getDeptYearLabel(p.studentId),
          cgpa: p.studentId.cgpa || 0,
          email: p.studentId.email,
          phone: p.studentId.phone,
          resumeUrl: p.studentId.resumeUrl || '',
          role: p.role,
          package: p.package,
          placementDate: p.placementDate,
          offerType: p.offerType || 'on_campus',
          offerLetterUrl: p.offerLetterUrl || '',
          offerLetterName: p.offerLetterName || '',
          status: p.status || 'placed',
          source: 'placement_record',
          visitNumber: vNum,
          driveId: p.driveId || null,
        });
      }
    });

    drives.forEach((d) => {
      (d.finalSelectedStudents || []).forEach((f) => {
        const s = f.studentId;
        if (s && s._id) {
          const sId = s._id.toString();
          let vNum = Number(d.visitNumber) || 1;

          // If linked to an existing placement, respect that placement's true visitNumber
          if (f.placementId) {
            const linked = placementById.get(f.placementId.toString());
            if (linked) {
              if (linked.visitNumber) vNum = Number(linked.visitNumber);
              // If this drive's visitNumber doesn't match the placement's visitNumber, skip mismatched ghost entry
              if (Number(d.visitNumber || 1) !== vNum) {
                return;
              }
            }
          }

          const key = `${sId}_${vNum}`;
          if (!placedMap.has(key) || !placedMap.get(key).driveId) {
            placedMap.set(key, {
              _id: s._id,
              placementId: f.placementId || null,
              name: s.name,
              rollNumber: s.rollNumber,
              department: s.department,
              batch: s.batch,
              deptYearLabel: getDeptYearLabel(s),
              cgpa: s.cgpa || 0,
              email: s.email,
              phone: s.phone,
              resumeUrl: s.resumeUrl || '',
              role: f.role || d.role,
              package: f.package || d.package,
              placementDate: f.placementDate || d.driveDate,
              driveId: d._id,
              driveTitle: d.title || d.role,
              visitNumber: vNum,
              offerType: 'on_campus',
              offerLetterUrl: f.offerLetterUrl || '',
              offerLetterName: f.offerLetterName || '',
              status: 'placed',
              source: 'drive_selection',
            });
          }
        }
      });
    });

    const placedStudents = Array.from(placedMap.values());

    // 4. Collect Attended Students (all registered / round participants segmented per visit)
    const attendedMap = new Map();

    drives.forEach((d) => {
      const driveTitle = d.role ? `${d.role} (${new Date(d.driveDate).toLocaleDateString('en-IN')})` : d.title;
      const vNum = Number(d.visitNumber) || 1;

      (d.registeredStudents || []).forEach((s) => {
        if (!s || !s._id) return;
        const sId = s._id.toString();
        const key = `${sId}_${vNum}`;
        const isPlacedInVisit = placedMap.has(key);

        if (!attendedMap.has(key)) {
          attendedMap.set(key, {
            _id: s._id,
            attendanceKey: key,
            name: s.name,
            rollNumber: s.rollNumber,
            department: s.department,
            batch: s.batch,
            deptYearLabel: getDeptYearLabel(s),
            cgpa: s.cgpa || 0,
            email: s.email,
            phone: s.phone,
            resumeUrl: s.resumeUrl || '',
            isPlaced: isPlacedInVisit,
            visitNumber: vNum,
            driveId: d._id,
            driveRole: d.role,
            driveTitle,
            drives: [
              {
                driveId: d._id,
                role: d.role,
                driveDate: d.driveDate,
                driveTitle,
                visitNumber: vNum,
              },
            ],
            highestRound: isPlacedInVisit ? (d.rounds?.[d.rounds.length - 1]?.name || 'Final Selection') : 'Registered',
            latestStatus: isPlacedInVisit ? 'placed' : 'registered',
          });
        }
      });

      // Audit round progression for each attended student
      (d.rounds || []).forEach((round) => {
        (round.candidates || []).forEach((cand) => {
          const s = cand.studentId;
          if (!s || !s._id) return;
          const sId = s._id.toString();
          const key = `${sId}_${vNum}`;
          if (attendedMap.has(key)) {
            const entry = attendedMap.get(key);
            if (entry.isPlaced) {
              entry.latestStatus = 'placed';
              entry.highestRound = d.rounds?.[d.rounds.length - 1]?.name || round.name;
            } else if (cand.status === 'selected' || cand.status === 'shortlisted') {
              entry.highestRound = round.name;
              if (cand.status === 'selected') entry.latestStatus = 'selected';
              else entry.latestStatus = 'shortlisted';
            } else if (cand.status === 'eliminated') {
              entry.highestRound = `Eliminated in ${round.name}`;
              entry.latestStatus = 'eliminated';
            }
          }
        });
      });
    });

    const attendedStudents = Array.from(attendedMap.values());

    // 5. Build Segmented Visits History (Point of Contact for Visit 1, Visit 2, etc.)
    let visitsList = Array.isArray(company.visitsList) && company.visitsList.length > 0
      ? company.visitsList.map((v) => v.toObject ? v.toObject() : v)
      : [];

    const maxVisitNum = Math.max(
      company.visits || 1,
      ...drives.map((d) => d.visitNumber || 1),
      ...placedStudents.map((p) => p.visitNumber || 1),
      visitsList.length
    );

    for (let v = 1; v <= maxVisitNum; v++) {
      if (!visitsList.some((entry) => Number(entry.visitNumber) === v)) {
        visitsList.push({
          visitNumber: v,
          contactPerson: v === 1 && company.contactPerson ? company.contactPerson : (company.contactPerson || 'Campus Recruitment Lead'),
          contactRole: company.contactRole || 'Campus Hiring Lead / HR Manager',
          contactEmail: company.contactEmail || '',
          contactPhone: company.contactPhone || '',
          location: company.location || '',
          description: company.description || '',
          date: company.createdAt || new Date(),
        });
      }
    }
    visitsList.sort((a, b) => a.visitNumber - b.visitNumber);

    // 6. Aggregate statistics
    const packages = placedStudents.map((p) => Number(p.package)).filter((n) => !isNaN(n) && n > 0);
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
    const averagePackage = packages.length > 0 ? Number((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2)) : 0;

    const departmentBreakdown = {};
    placedStudents.forEach((p) => {
      const dept = (p.department || 'Other').toUpperCase();
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;
    });

    const stats = {
      totalPlaced: placedStudents.length,
      totalAttended: attendedStudents.length,
      totalDrives: drives.length,
      highestPackage,
      averagePackage,
      departmentBreakdown,
    };

    const drivesSummary = drives.map((d) => ({
      _id: d._id,
      title: d.title,
      role: d.role,
      roles: d.roles && d.roles.length > 0 ? d.roles : [d.role],
      package: d.package,
      driveDate: d.driveDate,
      status: d.status,
      visitNumber: d.visitNumber || 1,
      roundsCount: (d.rounds || []).length,
      registeredCount: (d.registeredStudents || []).length,
      placedCount: (d.finalSelectedStudents || []).length,
      minCgpa: d.minCgpa,
      maxCurrentArrears: d.maxCurrentArrears,
    }));

    res.json({
      ...company.toObject(),
      company,
      visitsList,
      stats,
      placedStudents,
      attendedStudents,
      drives: drivesSummary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create company
// @route   POST /api/companies
exports.createCompany = async (req, res, next) => {
  try {
    const data = { ...req.body };
    const visitNum = Number(data.visits) || 1;
    if (!data.visitsList || data.visitsList.length === 0) {
      data.visitsList = [
        {
          visitNumber: visitNum,
          contactPerson: data.contactPerson || '',
          contactRole: data.contactRole || 'Campus Hiring Lead / HR Manager',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          location: data.location || '',
          description: data.description || '',
          date: new Date(),
        },
      ];
    }
    const company = await Company.create(data);
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
exports.updateCompany = async (req, res, next) => {
  try {
    const existing = await Company.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('Company not found');
    }

    const data = { ...req.body };
    const currentVisits = existing.visits || 1;
    const incomingVisits = Number(data.visits) || currentVisits;

    // Maintain visitsList history without overwriting previous visits' contact person!
    let visitsList = Array.isArray(existing.visitsList)
      ? existing.visitsList.map((v) => (v.toObject ? v.toObject() : v))
      : [];

    if (visitsList.length === 0) {
      visitsList.push({
        visitNumber: 1,
        contactPerson: existing.contactPerson || '',
        contactRole: existing.contactRole || 'Campus Hiring Lead / HR Manager',
        contactEmail: existing.contactEmail || '',
        contactPhone: existing.contactPhone || '',
        location: existing.location || '',
        description: existing.description || '',
        date: existing.createdAt || new Date(),
      });
    }

    const targetVisit = incomingVisits;
    const existingVisitIdx = visitsList.findIndex((v) => Number(v.visitNumber) === targetVisit);

    const visitEntry = {
      visitNumber: targetVisit,
      contactPerson: data.contactPerson !== undefined ? data.contactPerson : existing.contactPerson,
      contactRole: data.contactRole !== undefined ? data.contactRole : existing.contactRole,
      contactEmail: data.contactEmail !== undefined ? data.contactEmail : existing.contactEmail,
      contactPhone: data.contactPhone !== undefined ? data.contactPhone : existing.contactPhone,
      location: data.location !== undefined ? data.location : existing.location,
      description: data.description !== undefined ? data.description : existing.description,
      date: new Date(),
    };

    if (existingVisitIdx >= 0) {
      visitsList[existingVisitIdx] = { ...visitsList[existingVisitIdx], ...visitEntry };
    } else {
      visitsList.push(visitEntry);
    }

    visitsList.sort((a, b) => a.visitNumber - b.visitNumber);
    data.visitsList = visitsList;
    data.visits = Math.max(incomingVisits, visitsList.length);

    const company = await Company.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    res.json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
};
