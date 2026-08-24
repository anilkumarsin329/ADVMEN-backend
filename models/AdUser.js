const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'advertiser'],
    required: true,
  },
  phone: {
    type: String,
  },
  avatar: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  earnings: {
    type: Number,
    default: 0, // Used for owners
  }
}, { timestamps: true })

// Hash password before saving
adUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Match password method
adUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('AdUser', adUserSchema)
