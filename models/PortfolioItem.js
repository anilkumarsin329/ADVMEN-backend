/**
 * models/PortfolioItem.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Portfolio/Work Item Model
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const resultSchema = new mongoose.Schema({
  metric: { type: String, required: true },
  label: { type: String, required: true }
}, { _id: false })

const portfolioItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Portfolio title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: [true, 'Slug is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    challenge: {
      type: String,
      trim: true,
    },
    solution: {
      type: String,
      trim: true,
    },
    results: {
      type: [resultSchema],
      default: [],
    },
    tech: {
      type: [String],
      default: [],
    },
    client: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    projectLink: {
      type: String,
      trim: true,
      default: '',
    },
    projectUrl: {
      type: String,
      trim: true,
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

module.exports = mongoose.model('PortfolioItem', portfolioItemSchema)
