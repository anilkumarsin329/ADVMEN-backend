const mongoose = require('mongoose')

const adSpaceSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdUser',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  spaceType: {
    type: String,
    enum: ['Wall', 'Shop/Storefront', 'Building', 'Vehicle', 'Digital Screen', 'Website/App', 'Other'],
    required: true,
  },
  photos: [{
    type: String, // R2 URLs
  }],
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  dimensions: {
    width: { type: Number },
    height: { type: Number },
    unit: { type: String, default: 'ft' },
  },
  pricing: {
    daily: { type: Number },
    weekly: { type: Number },
    monthly: { type: Number, required: true },
  },
  availabilityCalendar: [{
    date: { type: Date },
    isAvailable: { type: Boolean, default: true },
  }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'pending'],
    default: 'available',
  },
  audience: {
    dailyTraffic: { type: Number },
    demographics: { type: String },
  },
  isApproved: {
    type: Boolean,
    default: false, // Requires admin approval
  },
}, { timestamps: true })

module.exports = mongoose.model('AdSpace', adSpaceSchema)
