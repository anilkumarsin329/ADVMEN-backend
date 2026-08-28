const mongoose = require('mongoose')

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
    trim: true,
  }
}, { timestamps: true })

module.exports = mongoose.model('Client', clientSchema)
