const mongoose = require('mongoose');

const timeTableSlotSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
    },
    semester: {
      type: String,
      default: 'ODD SEM',
      trim: true,
    },
    day: {
      type: String,
      required: true,
      enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    span: {
      type: Number,
      default: 1,
      min: 1,
      max: 7,
    },
    className: {
      type: String,
      trim: true,
      default: '', // e.g. "III- EEE", "II- IT", "IV- ECE"
    },
    department: {
      type: String,
      trim: true,
      default: '', // e.g. "EEE", "IT", "ECE"
    },
    year: {
      type: String,
      trim: true,
      default: '', // e.g. "II", "III", "IV"
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
    },
    facultyName: {
      type: String,
      trim: true,
      default: '',
    },
    topic: {
      type: String,
      trim: true,
      default: '', // What topic they teach for each class
    },
    room: {
      type: String,
      trim: true,
      default: '', // Venue / Room / Lab
    },
  },
  { timestamps: true }
);

timeTableSlotSchema.index({ academicYear: 1, semester: 1, day: 1, period: 1 });

module.exports = mongoose.model('TimeTableSlot', timeTableSlotSchema);
