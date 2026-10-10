const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
    },
    facultyCode: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CE', 'IT', 'AIDS', 'AIML', 'S&H', 'Placement', 'Other'],
      default: 'Placement',
    },
    designation: {
      type: String,
      trim: true,
      default: 'Placement Trainer',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    specialization: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      default: '#2563eb',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
