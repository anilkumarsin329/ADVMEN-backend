const jwt = require('jsonwebtoken')
const AdUser = require('../models/AdUser')

const adAuth = async (req, res, next) => {
  let token = req.cookies.adToken

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await AdUser.findById(decoded.id).select('-password')
    next()
  } catch (error) {
    console.error('AdAuth middleware error:', error)
    res.status(401).json({ success: false, message: 'Not authorized, token failed' })
  }
}

// Role authorization middleware
const authorizeAdRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route`
      })
    }
    next()
  }
}

module.exports = { adAuth, authorizeAdRoles }
