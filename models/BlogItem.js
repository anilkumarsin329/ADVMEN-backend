/**
 * models/BlogItem.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Blog Article Model
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const blogItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Blog slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Technology',
      trim: true,
    },
    author: {
      type: String,
      default: 'ADVMEN Team',
      trim: true,
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    readTime: {
      type: String,
      default: '5 min read',
      trim: true,
    },
    tags: {
      type: [String],
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

blogItemSchema.index({ isActive: 1, createdAt: -1 })
blogItemSchema.index({ category: 1 })

module.exports = mongoose.model('BlogItem', blogItemSchema)
