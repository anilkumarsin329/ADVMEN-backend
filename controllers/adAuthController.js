const AdUser = require('../models/AdUser')
const jwt = require('jsonwebtoken')

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })
}

// @desc    Register a new ad user (owner or advertiser)
// @route   POST /api/ad-auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' })
    }

    if (!['owner', 'advertiser'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    const userExists = await AdUser.findOne({ email })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }

    const user = await AdUser.create({
      name,
      email,
      password,
      role,
      phone,
    })

    if (user) {
      const token = generateToken(user._id)

      res.cookie('adToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      })
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' })
    }
  } catch (error) {
    console.error('Register Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Auth user & get token
// @route   POST /api/ad-auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await AdUser.findOne({ email })

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id)

      res.cookie('adToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      })
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' })
    }
  } catch (error) {
    console.error('Login Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Logout user / clear cookie
// @route   POST /api/ad-auth/logout
// @access  Public
exports.logout = (req, res) => {
  res.cookie('adToken', '', {
    httpOnly: true,
    expires: new Date(0),
  })
  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

// @desc    Get user profile
// @route   GET /api/ad-auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    let token = req.cookies.adToken

    if (!token) {
      return res.json({ success: false, data: null, message: 'No token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await AdUser.findById(decoded.id).select('-password')
    
    if (user) {
      res.json({ success: true, data: user })
    } else {
      res.json({ success: false, data: null, message: 'User not found' })
    }
  } catch (error) {
    console.error('Get Me Error:', error)
    res.json({ success: false, data: null, message: 'Invalid or expired token' })
  }
}
