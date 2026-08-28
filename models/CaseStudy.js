/**
 * models/CaseStudy.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Case Study / Success Story Schema
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const metricSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
})

const caseStudySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    client: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Digital Marketing',
        'App Development',
        'SEO & Content',
        'Branding',
        'Media Production',
        'AI & Cloud',
        'Other',
      ],
      default: 'Web Development',
    },
    summary: {
      type: String,
      required: [true, 'Summary excerpt is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    challenge: {
      type: String,
      default: '',
    },
    solution: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      required: [true, 'Cover image is required'],
    },
    metrics: [metricSchema],
    tech: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    projectUrl: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Draft'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
)

// Index for fast query lookups
caseStudySchema.index({ slug: 1 })
caseStudySchema.index({ status: 1, order: 1 })

module.exports = mongoose.model('CaseStudy', caseStudySchema)
