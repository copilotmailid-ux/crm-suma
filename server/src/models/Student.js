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
  },
  { timestamps: true }
);

// Index for search performance
studentSchema.index({ name: 'text', rollNumber: 'text', email: 'text' });

module.exports = mongoose.model('Student', studentSchema);
