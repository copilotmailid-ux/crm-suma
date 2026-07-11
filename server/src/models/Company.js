const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    studentsPlaced: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

companySchema.index({ name: 'text', industry: 'text' });

module.exports = mongoose.model('Company', companySchema);
