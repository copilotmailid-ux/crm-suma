const Company = require('../models/Company');

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
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

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

// @desc    Get single company
// @route   GET /api/companies/:id
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Create company
// @route   POST /api/companies
exports.createCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      res.status(404);
      throw new Error('Company not found');
    }

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
