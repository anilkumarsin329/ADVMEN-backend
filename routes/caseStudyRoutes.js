/**
 * routes/caseStudyRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Case Study API Routes
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const auth = require('../middleware/auth')
const {
  getCaseStudies,
  getAllCaseStudiesAdmin,
  getCaseStudyBySlug,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
} = require('../controllers/caseStudyController')

// Configure Multer Storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'casestudy-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
})

// Public Routes
router.get('/', getCaseStudies)
router.get('/all', auth, getAllCaseStudiesAdmin)
router.get('/:slug', getCaseStudyBySlug)

// Admin Protected Routes
router.post('/', auth, upload.single('imageFile'), createCaseStudy)
router.put('/:id', auth, upload.single('imageFile'), updateCaseStudy)
router.delete('/:id', auth, deleteCaseStudy)

module.exports = router
