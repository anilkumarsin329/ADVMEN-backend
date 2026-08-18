/**
 * models/Contact.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Contact Inquiry Model
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    budget: { type: String },
    timeline: { type: String },
    industry: { type: String },
    projectType: { type: String },
    goals: { type: String },
    message: { type: String, required: true },
    status: { type: String, default: 'New', enum: ['New', 'Read', 'Replied'] },
    isStarred: { type: Boolean, default: false },
  },
  { timestamps: true }
)

contactSchema.index({ createdAt: -1 })
contactSchema.index({ status: 1 })

module.exports = mongoose.model('Contact', contactSchema)
