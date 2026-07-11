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
    status: {
      type: String,
      enum: ['offered', 'accepted', 'joined', 'rejected'],
      default: 'offered',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Placement', placementSchema);
