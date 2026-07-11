const Student = require('../models/Student');
const Company = require('../models/Company');
const Placement = require('../models/Placement');
const Alumni = require('../models/Alumni');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalStudents, placedStudents, totalAlumni, totalCompanies, totalPlacements] =
      await Promise.all([
        Student.countDocuments(),
        Student.countDocuments({ status: 'placed' }),
        Alumni.countDocuments(),
        Company.countDocuments(),
        Placement.countDocuments(),
      ]);

    res.json({
      totalStudents,
      placedStudents,
      unplacedStudents: totalStudents - placedStudents,
      totalAlumni,
      totalCompanies,
      totalPlacements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department-wise placement stats
// @route   GET /api/dashboard/dept-wise
exports.getDeptWise = async (req, res, next) => {
  try {
    const deptStats = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          placed: {
            $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      deptStats.map((d) => ({
        department: d._id,
        total: d.total,
        placed: d.placed,
        unplaced: d.total - d.placed,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get company-wise placement counts
// @route   GET /api/dashboard/company-wise
exports.getCompanyWise = async (req, res, next) => {
  try {
    const companyStats = await Placement.aggregate([
      {
        $group: {
          _id: '$companyId',
          count: { $sum: 1 },
          avgPackage: { $avg: '$package' },
        },
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },
      {
        $project: {
          companyName: '$company.name',
          count: 1,
          avgPackage: { $round: ['$avgPackage', 2] },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json(companyStats);
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch-wise placement counts
// @route   GET /api/dashboard/batch-wise
exports.getBatchWise = async (req, res, next) => {
  try {
    const batchStats = await Student.aggregate([
      {
        $group: {
          _id: '$batch',
          total: { $sum: 1 },
          placed: {
            $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json(
      batchStats.map((b) => ({
        batch: b._id,
        total: b.total,
        placed: b.placed,
        unplaced: b.total - b.placed,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent placements
// @route   GET /api/dashboard/recent
exports.getRecent = async (req, res, next) => {
  try {
    const recentPlacements = await Placement.find()
      .populate('studentId', 'name rollNumber department batch')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(recentPlacements);
  } catch (error) {
    next(error);
  }
};

// @desc    Get year-wise / batch-wise detailed analysis stats
// @route   GET /api/dashboard/batch-analysis
exports.getBatchAnalysis = async (req, res, next) => {
  try {
    const { batch } = req.query;
    
    // 1. Build query filters
    const matchQuery = batch ? { batch } : {};

    // 2. Fetch student statistics and placed student IDs and dept stats in parallel!
    const [totalStudents, placedStudents, placedStudentIds, deptStatsRaw] = await Promise.all([
      Student.countDocuments(matchQuery),
      Student.countDocuments({ ...matchQuery, status: 'placed' }),
      Student.find({ ...matchQuery, status: 'placed' }).distinct('_id'),
      Student.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            placed: { $sum: { $cond: [{ $eq: ['$status', 'placed'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const unplacedStudents = totalStudents - placedStudents;
    const placementPercentage = totalStudents > 0 
      ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(2)) 
      : 0;

    const deptStats = deptStatsRaw.map(d => ({
      department: d._id,
      total: d.total,
      placed: d.placed,
      unplaced: d.total - d.placed,
      percentage: d.total > 0 ? parseFloat(((d.placed / d.total) * 100).toFixed(2)) : 0
    }));

    // 3. Fetch salary, company and range stats in parallel!
    const [packageStatsArr, companyStats, rangeStatsRaw] = await Promise.all([
      Placement.aggregate([
        { $match: { studentId: { $in: placedStudentIds } } },
        {
          $group: {
            _id: null,
            avgPackage: { $avg: '$package' },
            highestPackage: { $max: '$package' },
            lowestPackage: { $min: '$package' },
          }
        }
      ]),
      Placement.aggregate([
        { $match: { studentId: { $in: placedStudentIds } } },
        {
          $group: {
            _id: '$companyId',
            count: { $sum: 1 },
            placements: { $push: { studentId: '$studentId' } }
          }
        },
        { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
        { $unwind: '$company' },
        {
          $lookup: {
            from: 'students',
            localField: 'placements.studentId',
            foreignField: '_id',
            as: 'studentsDetails'
          }
        },
        {
          $project: {
            companyName: '$company.name',
            count: 1,
            students: {
              $map: {
                input: '$studentsDetails',
                as: 's',
                in: {
                  name: '$$s.name',
                  rollNumber: '$$s.rollNumber',
                  department: '$$s.department'
                }
              }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Placement.aggregate([
        { $match: { studentId: { $in: placedStudentIds } } },
        {
          $group: {
            _id: null,
            below3: { $sum: { $cond: [{ $lt: ['$package', 3] }, 1, 0] } },
            between3And6: { $sum: { $cond: [{ $and: [{ $gte: ['$package', 3] }, { $lt: ['$package', 6] }] }, 1, 0] } },
            between6And10: { $sum: { $cond: [{ $and: [{ $gte: ['$package', 6] }, { $lt: ['$package', 10] }] }, 1, 0] } },
            above10: { $sum: { $cond: [{ $gte: ['$package', 10] }, 1, 0] } }
          }
        }
      ])
    ]);

    const pStats = packageStatsArr[0] || { avgPackage: 0, highestPackage: 0, lowestPackage: 0 };
    const ranges = rangeStatsRaw[0] || { below3: 0, between3And6: 0, between6And10: 0, above10: 0 };
    const packageDistribution = [
      { range: '< 3 LPA', count: ranges.below3 },
      { range: '3 - 6 LPA', count: ranges.between3And6 },
      { range: '6 - 10 LPA', count: ranges.between6And10 },
      { range: '> 10 LPA', count: ranges.above10 }
    ];

    res.json({
      summary: {
        totalStudents,
        placedStudents,
        unplacedStudents,
        placementPercentage,
        highestPackage: pStats.highestPackage || 0,
        averagePackage: pStats.avgPackage ? parseFloat(pStats.avgPackage.toFixed(2)) : 0,
        lowestPackage: pStats.lowestPackage || 0,
      },
      deptStats,
      companyStats,
      packageDistribution
    });
  } catch (error) {
    next(error);
  }
};

