/**
 * routes/adminRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Admin Auth Routes
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' })
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server configuration error.' })
  }

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const userPayload = { email, name: 'Super Admin', role: 'Super Admin' }
    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '7d' })
    return res.status(200).json({ success: true, token, user: userPayload })
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect email or password.' })
})

// GET /api/admin/me
router.get('/me', auth, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  })
})

module.exports = router
