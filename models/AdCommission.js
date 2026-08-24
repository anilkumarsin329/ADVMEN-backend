const mongoose = require('mongoose')

const adCommissionSchema = new mongoose.Schema({
  commissionPct: {
    type: Number,
    default: 15, // Default 15%
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who updated it
  }
}, { timestamps: true })

module.exports = mongoose.model('AdCommission', adCommissionSchema)
