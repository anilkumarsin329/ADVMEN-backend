/**
 * models/Application.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Job Application Model
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Job Title is required'],
      trim: true,
    },
    jobDepartment: {
      type: String,
      default: 'Engineering',
      trim: true,
    },
    jobType: {
      type: String,
      default: 'Full-Time',
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    portfolio: {
      type: String,
      default: '',
      trim: true,
    },
    resume: {
      type: String,
      default: '',
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: '',
      trim: true,
    },
    experience: {
      type: String,
      default: '',
      trim: true,
    },
    coverLetter: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'],
      default: 'Pending',
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

applicationSchema.index({ createdAt: -1 })
applicationSchema.index({ jobType: 1 })
applicationSchema.index({ status: 1 })

module.exports = mongoose.model('Application', applicationSchema)
