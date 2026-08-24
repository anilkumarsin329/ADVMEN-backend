const mongoose = require('mongoose')

const adBookingSchema = new mongoose.Schema({
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdUser',
    required: true,
  },
  space: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdSpace',
    required: true,
  },
  campaign: {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number },
  },
  creatives: [{
    type: String, // R2 URLs
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'payment_pending', 'paid', 'ad_uploaded', 'admin_verified', 'live', 'completed', 'cancelled'],
    default: 'pending',
  },
  pricing: {
    spacePrice: { type: Number, required: true },
    commissionPct: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    ownerPayout: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  payment: {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date },
  },
  refund: {
    requested: { type: Boolean, default: false },
    reason: { type: String },
    processedAt: { type: Date },
  }
}, { timestamps: true })

module.exports = mongoose.model('AdBooking', adBookingSchema)
