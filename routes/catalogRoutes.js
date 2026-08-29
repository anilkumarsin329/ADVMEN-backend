/**
 * routes/catalogRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Catalog CRUD Routes
 * High-performance cached endpoints with .lean() Mongoose queries
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const CatalogItem = require('../models/CatalogItem')
const auth = require('../middleware/auth')
const { cacheMiddleware, clearCache } = require('../middleware/cache')

// GET /api/catalog — public, only active items (Cached)
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const items = await CatalogItem.find({ isActive: true }).sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/catalog/all — admin, all items
router.get('/all', auth, async (req, res, next) => {
  try {
    const items = await CatalogItem.find().sort({ createdAt: -1 }).lean()
    return res.status(200).json(items)
  } catch (err) {
    next(err)
  }
})

// GET /api/catalog/:id (Cached)
router.get('/:id', cacheMiddleware(60), async (req, res, next) => {
  try {
    const item = await CatalogItem.findById(req.params.id).lean()
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' })
    }
    return res.status(200).json(item)
  } catch (err) {
    next(err)
  }
})

// POST /api/catalog
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, category, price, image, description, features, isActive } = req.body

    const newItem = new CatalogItem({
      name,
      category,
      price,
      image,
      description,
      features: Array.isArray(features) ? features : [],
      isActive: isActive !== undefined ? isActive : true,
    })

    const savedItem = await newItem.save()
    clearCache('/api/catalog')
    return res.status(201).json({
      success: true,
      message: 'Catalog item created successfully',
      item: savedItem,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/catalog/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const updatedItem = await CatalogItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    )

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' })
    }
    clearCache('/api/catalog')
    return res.status(200).json({
      success: true,
      message: 'Catalog item updated successfully',
      item: updatedItem,
    })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/catalog/:id/toggle
router.patch('/:id/toggle', auth, async (req, res, next) => {
  try {
    const item = await CatalogItem.findById(req.params.id)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' })
    }
    item.isActive = !item.isActive
    const updatedItem = await item.save()
    clearCache('/api/catalog')
    return res.status(200).json({
      success: true,
      message: `Catalog item ${updatedItem.isActive ? 'enabled' : 'disabled'}`,
      item: updatedItem,
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/catalog/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deletedItem = await CatalogItem.findByIdAndDelete(req.params.id)
    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Catalog item not found' })
    }
    clearCache('/api/catalog')
    return res.status(200).json({
      success: true,
      message: 'Catalog item deleted successfully',
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
