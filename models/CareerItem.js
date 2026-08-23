/**
 * models/CareerItem.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Career Opening / Job Model
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const careerItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    location: {
      type: String,
      default: 'Gurugram / Remote',
      trim: true,
    },
    type: {
      type: String,
      default: 'Full-Time',
      trim: true,
    },
    experience: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    salary: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    stipend: {
      type: String,
      trim: true,
    },
    certificate: {
      type: String,
      trim: true,
    },
    workMode: {
      type: String,
      trim: true,
    },
    registrationFee: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

careerItemSchema.index({ isActive: 1, createdAt: -1 })

module.exports = mongoose.model('CareerItem', careerItemSchema)
