/**
 * routes/portfolioRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Portfolio CRUD Routes
 * High-performance cached endpoints with .lean() Mongoose queries
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const PortfolioItem = require('../models/PortfolioItem')
const auth = require('../middleware/auth')
const { cacheMiddleware, clearCache } = require('../middleware/cache')

// GET /api/portfolio — public, only active items (Cached)
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const items = await PortfolioItem.find({ isActive: true }).sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/portfolio/all — admin, all items
router.get('/all', auth, async (req, res, next) => {
  try {
    const items = await PortfolioItem.find().sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/portfolio/:slug — public, get by slug (Cached)
router.get('/:slug', cacheMiddleware(60), async (req, res, next) => {
  try {
    let item = await PortfolioItem.findOne({ slug: req.params.slug }).lean()
    if (!item && req.params.slug.match(/^[0-9a-fA-F]{24}$/)) {
      item = await PortfolioItem.findById(req.params.slug).lean()
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }
    return res.status(200).json(item)
  } catch (err) {
    next(err)
  }
})

// POST /api/portfolio
router.post('/', auth, async (req, res, next) => {
  try {
    const { 
      title, slug, category, year, tags, description, 
      tagline, challenge, solution, results, tech, client, duration, image, projectLink, projectUrl, isActive 
    } = req.body

    const newItem = new PortfolioItem({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      category,
      year: year || new Date().getFullYear().toString(),
      tags: tags || [],
      description: description || '',
      tagline: tagline || '',
      challenge: challenge || '',
      solution: solution || '',
      results: results || [],
      tech: tech || [],
      client: client || '',
      duration: duration || '',
      image: image || '',
      projectLink: projectLink || projectUrl || '',
      projectUrl: projectUrl || projectLink || '',
      isActive: isActive !== false,
    })

    const saved = await newItem.save()
    clearCache('/api/portfolio')
    return res.status(201).json({ success: true, item: saved })
  } catch (err) {
    next(err)
  }
})

// PUT /api/portfolio/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const updated = await PortfolioItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    )
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }
    clearCache('/api/portfolio')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/portfolio/:id/toggle
router.patch('/:id/toggle', auth, async (req, res, next) => {
  try {
    const item = await PortfolioItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }
    item.isActive = !item.isActive
    const updated = await item.save()
    clearCache('/api/portfolio')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/portfolio/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deleted = await PortfolioItem.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' })
    }
    clearCache('/api/portfolio')
    return res.status(200).json({ success: true, message: 'Portfolio item deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
