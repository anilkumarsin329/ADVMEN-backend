/**
 * routes/careerRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Careers CRUD API Routes
 * High-performance cached endpoints with .lean() Mongoose queries
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const CareerItem = require('../models/CareerItem')
const auth = require('../middleware/auth')
const { cacheMiddleware, clearCache } = require('../middleware/cache')

// GET /api/careers — Public: All active job openings (Cached)
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const items = await CareerItem.find({ isActive: true }).sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/careers/all — Admin: All job openings
router.get('/all', auth, async (req, res, next) => {
  try {
    const items = await CareerItem.find().sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/careers/:id — Public/Admin: Single opening details (Cached)
router.get('/:id', cacheMiddleware(60), async (req, res, next) => {
  try {
    const item = await CareerItem.findById(req.params.id).lean()
    if (!item) {
      return res.status(404).json({ success: false, message: 'Career opening not found' })
    }
    return res.status(200).json(item)
  } catch (err) {
    next(err)
  }
})

// POST /api/careers — Admin: Create new career opening
router.post('/', auth, async (req, res, next) => {
  try {
    const { 
      title, department, location, type, experience, 
      skills, responsibilities, requirements, salary, image, isActive 
    } = req.body

    const newCareer = new CareerItem({
      title, department, location, type, experience, 
      skills, responsibilities, requirements, salary, image, isActive
    })

    const saved = await newCareer.save()
    clearCache('/api/careers')
    return res.status(201).json({ success: true, item: saved })
  } catch (err) {
    next(err)
  }
})

// PUT /api/careers/:id — Admin: Update career opening
router.put('/:id', auth, async (req, res, next) => {
  try {
    const updated = await CareerItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Career opening not found' })
    }
    clearCache('/api/careers')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/careers/:id/toggle — Admin: Toggle active status
router.patch('/:id/toggle', auth, async (req, res, next) => {
  try {
    const item = await CareerItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Career opening not found' })
    }
    item.isActive = !item.isActive
    const updated = await item.save()
    clearCache('/api/careers')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/careers/:id — Admin: Delete career opening
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deleted = await CareerItem.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Career opening not found' })
    }
    clearCache('/api/careers')
    return res.status(200).json({ success: true, message: 'Career opening deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
