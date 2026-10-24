const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    visitNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    contactRole: {
      type: String,
      trim: true,
      default: 'Campus Hiring Lead / HR Manager',
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
    location: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true, timestamps: true }
);

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
    contactRole: {
      type: String,
      trim: true,
      default: 'Campus Hiring Lead / HR Manager',
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
    location: {
      type: String,
      trim: true,
      default: 'Chennai / Bangalore / Pan India',
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
    visits: {
      type: Number,
      default: 1,
      min: 0,
    },
    visitsList: [visitSchema],
  },
  { timestamps: true }
);

companySchema.index({ name: 'text', industry: 'text' });

module.exports = mongoose.model('Company', companySchema);
