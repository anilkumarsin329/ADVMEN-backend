/**
 * models/ServiceItem.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Service Item Model
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const serviceItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: [true, 'Slug is required'],
      trim: true,
    },
    tagline: {
      type: String,
      required: [true, 'Tagline is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    features: {
      type: [String],
      required: [true, 'Features list is required'],
      default: [],
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

module.exports = mongoose.model('ServiceItem', serviceItemSchema)
