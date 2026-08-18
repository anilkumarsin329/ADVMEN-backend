/**
 * routes/blogRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Blog Articles CRUD API Routes
 * High-performance cached endpoints with .lean() Mongoose queries
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const BlogItem = require('../models/BlogItem')
const auth = require('../middleware/auth')
const { cacheMiddleware, clearCache } = require('../middleware/cache')

// GET /api/blog — Public: All active blog articles (Cached)
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const items = await BlogItem.find({ isActive: true }).sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/blog/all — Admin: All blog articles (active + inactive)
router.get('/all', auth, async (req, res, next) => {
  try {
    const items = await BlogItem.find().sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/blog/:slugOrId — Public/Admin: Single blog post by slug or ID (Cached)
router.get('/:slugOrId', cacheMiddleware(60), async (req, res, next) => {
  try {
    const param = req.params.slugOrId
    let item = await BlogItem.findOne({ slug: param.toLowerCase() }).lean()
    if (!item && param.match(/^[0-9a-fA-F]{24}$/)) {
      item = await BlogItem.findById(param).lean()
    }
    if (!item) {
      return res.status(404).json({ success: false, message: 'Blog article not found' })
    }
    return res.status(200).json(item)
  } catch (err) {
    next(err)
  }
})

// POST /api/blog — Admin: Create new blog post
router.post('/', auth, async (req, res, next) => {
  try {
    const { 
      title, slug, excerpt, content, image, 
      category, author, date, readTime, tags, isActive 
    } = req.body

    const computedSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const newBlog = new BlogItem({
      title,
      slug: computedSlug,
      excerpt,
      content,
      image,
      category: category || 'Technology',
      author: author || 'ADVMEN Team',
      date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: readTime || '5 min read',
      tags: tags || [],
      isActive: isActive !== false
    })

    const saved = await newBlog.save()
    clearCache('/api/blog')
    return res.status(201).json({ success: true, item: saved })
  } catch (err) {
    next(err)
  }
})

// PUT /api/blog/:id — Admin: Update blog post
router.put('/:id', auth, async (req, res, next) => {
  try {
    if (req.body.slug) {
      req.body.slug = req.body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }
    const updated = await BlogItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Blog article not found' })
    }
    clearCache('/api/blog')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/blog/:id/toggle — Admin: Toggle active status
router.patch('/:id/toggle', auth, async (req, res, next) => {
  try {
    const item = await BlogItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Blog article not found' })
    }
    item.isActive = !item.isActive
    const updated = await item.save()
    clearCache('/api/blog')
    return res.status(200).json({ success: true, item: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/blog/:id — Admin: Delete blog post
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deleted = await BlogItem.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Blog article not found' })
    }
    clearCache('/api/blog')
    return res.status(200).json({ success: true, message: 'Blog article deleted' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
