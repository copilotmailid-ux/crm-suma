const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function(v) {
          return v === '' || /^\d{10}$/.test(v);
        },
        message: props => `${props.value} is not a valid 10-digit phone number! It must contain exactly 10 digits.`
      }
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML', 'Other'],
    },
    batch: {
      type: String,
      required: [true, 'Batch is required'],
      trim: true,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['not_placed', 'placed'],
      default: 'not_placed',
    },
    placementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Placement',
      default: null,
    },
    // Authentication
    password: {
      type: String,
      select: false,
    },
    // College Placement Profile Requirements
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    dob: {
      type: String,
      default: '',
    },
    tenthPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    twelfthPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentArrears: {
      type: Number,
      min: 0,
      default: 0,
    },
    historyOfArrears: {
      type: Number,
      min: 0,
      default: 0,
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for search performance
studentSchema.index({ name: 'text', rollNumber: 'text', email: 'text' });

const bcrypt = require('bcryptjs');

// Hash password before saving if modified
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
