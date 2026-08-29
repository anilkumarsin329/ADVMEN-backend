/**
 * routes/serviceRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Services CRUD Routes
 * High-performance cached endpoints with .lean() Mongoose queries
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const ServiceItem = require('../models/ServiceItem')
const auth = require('../middleware/auth')
const { cacheMiddleware, clearCache } = require('../middleware/cache')

// GET /api/services — public, only active items (Cached)
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const items = await ServiceItem.find({ isActive: true }).sort({ createdAt: 1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/services/all — admin, all items
router.get('/all', auth, async (req, res, next) => {
  try {
    const items = await ServiceItem.find().sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// Helper for slugifying strings
const slugify = (str) =>
  String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// GET /api/services/:idOrSlug (Cached)
router.get('/:idOrSlug', cacheMiddleware(60), async (req, res, next) => {
  try {
    const rawParam = String(req.params.idOrSlug || '').trim()
    const decodedParam = decodeURIComponent(rawParam).trim()
    const paramLower = rawParam.toLowerCase()
    const decodedLower = decodedParam.toLowerCase()
    const slugified = slugify(decodedParam)

    let item = await ServiceItem.findOne({
      $or: [
        { slug: rawParam },
        { slug: decodedParam },
        { slug: paramLower },
        { slug: decodedLower },
        { slug: slugified },
        { title: { $regex: new RegExp('^' + decodedParam.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') } },
        { title: { $regex: new RegExp('^' + slugified.replace(/-/g, '[^a-z0-9]+') + '$', 'i') } }
      ]
    }).lean()

    if (!item && require('mongoose').Types.ObjectId.isValid(rawParam)) {
      item = await ServiceItem.findById(rawParam).lean()
    }
    if (!item) {
      return res.status(404).json({ success: false, message: 'Service item not found' })
    }
    return res.status(200).json(item)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Service item not found' })
    }
    next(err)
  }
})

// POST /api/services
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, slug, tagline, image, description, features, isActive } = req.body

    const newItem = new ServiceItem({
      title,
      slug: slugify(slug || title),
      tagline,
      image,
      description,
      features: Array.isArray(features) ? features : [],
      isActive: isActive !== undefined ? isActive : true,
    })

    const saved = await newItem.save()
    clearCache('/api/services')
    return res.status(201).json({ success: true, item: saved })
  } catch (err) {
    next(err)
  }
})

// PUT /api/services/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const updateData = { ...req.body }
    if (updateData.slug || updateData.title) {
      updateData.slug = slugify(updateData.slug || updateData.title)
    }

    const updated = await ServiceItem.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Service item not found' })
    }
    clearCache('/api/services')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/services/:id/toggle
router.patch('/:id/toggle', auth, async (req, res, next) => {
  try {
    const item = await ServiceItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Service item not found' })
    }
    item.isActive = !item.isActive
    const updated = await item.save()
    clearCache('/api/services')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/services/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deleted = await ServiceItem.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Service item not found' })
    }
    clearCache('/api/services')
    return res.status(200).json({ success: true, message: 'Service item deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
