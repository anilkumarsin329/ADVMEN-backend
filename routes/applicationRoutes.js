/**
 * routes/applicationRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Job Application API Routes
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Application = require('../models/Application')
const { cacheMiddleware, clearCache } = require('../middleware/cache')
const { sendApplicationConfirmationEmail, sendStatusUpdateEmail } = require('../utils/sendEmail')

// Ensure uploads/applications directory exists
const uploadDir = path.join(__dirname, '../uploads/applications')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_')
    cb(null, `${Date.now()}_${cleanName}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

// @route   POST /api/applications/upload
// @desc    Upload candidate resume or photo (Public)
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' })
    }
    const fileUrl = `/uploads/applications/${req.file.filename}`
    return res.status(200).json({
      success: true,
      url: fileUrl,
      originalName: req.file.originalname,
      size: req.file.size
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// @route   POST /api/applications
// @desc    Submit a new job application (Public)
router.post('/', async (req, res, next) => {
  try {
    const {
      jobId,
      jobTitle,
      jobDepartment,
      jobType,
      name,
      email,
      phone,
      portfolio,
      resume,
      profilePhoto,
      experience,
      coverLetter,
    } = req.body

    if (!name || !email || !phone || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and job title are required.',
      })
    }

    const application = await Application.create({
      jobId: jobId || 'general',
      jobTitle,
      jobDepartment: jobDepartment || 'Engineering',
      jobType: jobType || 'Full-Time',
      name,
      email,
      phone,
      portfolio: portfolio || '',
      resume: resume || '',
      profilePhoto: profilePhoto || '',
      experience: experience || '',
      coverLetter: coverLetter || '',
    })

    // Trigger Brevo confirmation email asynchronously
    sendApplicationConfirmationEmail(application).catch((err) => {
      console.error('[Brevo Error] Failed to send confirmation email:', err)
    })

    // Invalidate applications cache
    clearCache('/api/applications')

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: application,
    })
  } catch (err) {
    next(err)
  }
})

// @route   GET /api/applications
// @desc    Fetch all job applications (Admin)
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const applications = await Application.find()
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    })
  } catch (err) {
    next(err)
  }
})

// @route   PATCH /api/applications/:id/status
// @desc    Update application status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['Pending', 'Reviewed', 'Shortlisted', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' })
    }

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean()

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application not found' })
    }

    // Trigger Brevo status update email asynchronously
    sendStatusUpdateEmail(updated, status).catch((err) => {
      console.error('[Brevo Error] Failed to send status email:', err)
    })

    clearCache('/api/applications')

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: updated,
    })
  } catch (err) {
    next(err)
  }
})

// @route   PATCH /api/applications/:id/star
// @desc    Toggle star on application
router.patch('/:id/star', async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id)
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' })
    }

    app.isStarred = !app.isStarred
    await app.save()

    clearCache('/api/applications')

    res.status(200).json({
      success: true,
      message: app.isStarred ? 'Application starred' : 'Application unstarred',
      data: app,
    })
  } catch (err) {
    next(err)
  }
})

// @route   DELETE /api/applications/:id
// @desc    Delete an application
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Application.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Application not found' })
    }

    clearCache('/api/applications')

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
