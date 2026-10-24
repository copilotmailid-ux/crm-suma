const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
    },
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
    },
    visitNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    role: {
      type: String,
      required: [true, 'Role/designation is required'],
      trim: true,
    },
    package: {
      type: Number,
      required: [true, 'Package (LPA) is required'],
      min: 0,
    },
    placementDate: {
      type: Date,
      required: [true, 'Placement date is required'],
    },
    offerType: {
      type: String,
      enum: ['on_campus', 'off_campus'],
      default: 'on_campus',
    },
    driveType: {
      type: String,
      enum: ['on_campus', 'external_off_campus', 'inter_college_pool', 'walk_in_job_fair', 'referral', 'other'],
      default: 'on_campus',
    },
    driveDetails: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['offered', 'accepted', 'joined', 'rejected'],
      default: 'offered',
    },
    offerLetterUrl: {
      type: String,
      trim: true,
      default: '',
    },
    offerLetterName: {
      type: String,
      trim: true,
      default: '',
    },
    offerLetterUploadedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Placement', placementSchema);
