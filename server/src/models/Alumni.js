const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    placementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Placement',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    currentCompany: {
      type: String,
      trim: true,
      default: '',
    },
    currentRole: {
      type: String,
      trim: true,
      default: '',
    },
    linkedIn: {
      type: String,
      trim: true,
      default: '',
    },
    graduationYear: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    companyShifted: {
      type: Boolean,
      default: false,
    },
    companyHistory: [
      {
        company: {
          type: String,
          default: '',
        },
        role: {
          type: String,
          default: '',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alumni', alumniSchema);
