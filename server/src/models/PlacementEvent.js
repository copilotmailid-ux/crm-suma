const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    batch: {
      type: String,
      trim: true,
      default: '2022-2026',
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Registered'],
      default: 'Registered',
    },
    markedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    chiefGuest: {
      type: String,
      required: [true, 'Chief guest / speaker name is required'],
      trim: true,
    },
    chiefGuestDesignation: {
      type: String,
      trim: true,
      default: '',
    },
    chiefGuestCompany: {
      type: String,
      trim: true,
      default: '',
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
      default: '10:00 AM',
    },
    endTime: {
      type: String,
      trim: true,
      default: '01:00 PM',
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    departments: {
      type: [String],
      required: [true, 'At least one department is required'],
      default: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
    },
    eligibleBatches: {
      type: [String],
      default: ['2022-2026', '2023-2027'],
    },
    eventType: {
      type: String,
      enum: ['Workshop', 'Guest Lecture', 'Bootcamp', 'Seminar', 'Mock Interview Drive', 'Hackathon', 'Webinar', 'Orientation'],
      default: 'Guest Lecture',
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    maxParticipants: {
      type: Number,
      default: 200,
      min: 1,
    },
    attendance: [attendanceRecordSchema],
    createdBy: {
      type: String,
      default: 'Super Admin',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for quick statistics
eventSchema.virtual('totalRegistered').get(function () {
  return this.attendance ? this.attendance.length : 0;
});

eventSchema.virtual('totalPresent').get(function () {
  return this.attendance ? this.attendance.filter((a) => a.status === 'Present').length : 0;
});

eventSchema.virtual('totalAbsent').get(function () {
  return this.attendance ? this.attendance.filter((a) => a.status === 'Absent').length : 0;
});

eventSchema.virtual('attendancePercentage').get(function () {
  if (!this.attendance || this.attendance.length === 0) return 0;
  const present = this.attendance.filter((a) => a.status === 'Present').length;
  return Math.round((present / this.attendance.length) * 100);
});

eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ title: 'text', chiefGuest: 'text', venue: 'text' });

module.exports = mongoose.model('PlacementEvent', eventSchema);
