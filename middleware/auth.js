/**
 * middleware/auth.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Admin Auth JWT Middleware
 * ─────────────────────────────────────────────────────────────
 */

const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  // Always set CORS header so browser gets it even on auth failures
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized access. Invalid or expired token.' })
  }
}

module.exports = auth
