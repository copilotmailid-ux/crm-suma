const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Drive title is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    package: {
      type: Number,
      required: [true, 'Salary package (LPA) is required'],
      min: 0,
    },
    jobLocation: {
      type: String,
      trim: true,
      default: 'Pan India / Hybrid',
    },
    eligibleDepartments: {
      type: [String],
      default: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
    },
    eligibleBatches: {
      type: [String],
      default: ['2022-2026', '2021-2025'],
    },
    minCgpa: {
      type: Number,
      default: 6.0,
      min: 0,
      max: 10,
    },
    minTenthMarks: {
      type: Number,
      default: 60,
    },
    minTwelfthMarks: {
      type: Number,
      default: 60,
    },
    maxCurrentArrears: {
      type: Number,
      default: 0,
    },
    maxHistoryArrears: {
      type: Number,
      default: 2,
    },
    driveDate: {
      type: Date,
      required: [true, 'Drive date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    jobDescription: {
      type: String,
      trim: true,
      default: '',
    },
    selectionProcess: {
      type: String,
      trim: true,
      default: 'Round 1: Online Assessment, Round 2: Technical Interview, Round 3: HR Interview',
    },
    applicationLink: {
      type: String,
      trim: true,
      default: '',
    },
    registeredStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    currentRound: {
      type: Number,
      default: 1,
    },
    rounds: [
      {
        roundNumber: {
          type: Number,
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          default: 'Interview',
        },
        scheduledDate: {
          type: Date,
        },
        venue: {
          type: String,
          trim: true,
          default: 'Online / Campus',
        },
        instructions: {
          type: String,
          trim: true,
          default: '',
        },
        status: {
          type: String,
          enum: ['Upcoming', 'In Progress', 'Completed'],
          default: 'In Progress',
        },
        candidates: [
          {
            studentId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Student',
              required: true,
            },
            status: {
              type: String,
              enum: ['shortlisted', 'selected', 'eliminated', 'pending'],
              default: 'pending',
            },
            feedback: {
              type: String,
              default: '',
            },
            eliminationReason: {
              type: String,
              default: '',
            },
            eliminationRemarks: {
              type: String,
              default: '',
            },
            emailSent: {
              type: Boolean,
              default: false,
            },
            emailSentAt: {
              type: Date,
            },
          },
        ],
        completedAt: {
          type: Date,
        },
      },
    ],
    finalSelectedStudents: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        role: { type: String, trim: true },
        package: { type: Number, min: 0 },
        placementDate: { type: Date, default: Date.now },
        placementId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Placement',
        },
        emailSent: { type: Boolean, default: false },
        emailSentAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

driveSchema.index({ companyName: 'text', role: 'text', title: 'text' });

module.exports = mongoose.model('Drive', driveSchema);
