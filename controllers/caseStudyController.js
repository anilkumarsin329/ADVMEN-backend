/**
 * controllers/caseStudyController.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN — Case Study Controller
 * ─────────────────────────────────────────────────────────────
 */

const CaseStudy = require('../models/CaseStudy')

// Placeholder case studies from the original seed; retired once the featured ones exist
const legacySlugs = ['case-study-1', 'case-study-2', 'case-study-3', 'case-study-4', 'case-study-5', 'case-study-6']

// Featured case studies (source: backend/data/featuredCaseStudies.json)
const featuredCaseStudies = require('../data/featuredCaseStudies.json')

// Upsert featured case studies by slug (never overwrites later admin edits).
// When they are first added, the old placeholder case studies are moved to Draft.
let featuredSynced = false
const syncFeaturedCaseStudies = async () => {
  if (featuredSynced) return
  const result = await CaseStudy.bulkWrite(
    featuredCaseStudies.map(item => ({
      updateOne: { filter: { slug: item.slug }, update: { $setOnInsert: item }, upsert: true },
    }))
  )
  if (result.upsertedCount > 0) {
    await CaseStudy.updateMany({ slug: { $in: legacySlugs } }, { $set: { status: 'Draft' } })
  }
  featuredSynced = true
}

// GET /api/case-studies — Public: Get active case studies
exports.getCaseStudies = async (req, res, next) => {
  try {
    await syncFeaturedCaseStudies()

    const items = await CaseStudy.find({ status: 'Active' })
      .sort({ order: 1, createdAt: -1 })
      .lean()

    res.status(200).json({ success: true, count: items.length, data: items })
  } catch (error) {
    next(error)
  }
}

// GET /api/case-studies/all — Admin: Get all case studies (including Drafts)
exports.getAllCaseStudiesAdmin = async (req, res, next) => {
  try {
    await syncFeaturedCaseStudies()

    const items = await CaseStudy.find()
      .sort({ order: 1, createdAt: -1 })
      .lean()

    res.status(200).json({ success: true, count: items.length, data: items })
  } catch (error) {
    next(error)
  }
}

// GET /api/case-studies/:slug — Public: Get single case study by slug or ID
exports.getCaseStudyBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params
    let item = await CaseStudy.findOne({ slug }).lean()
    
    if (!item && slug.match(/^[0-9a-fA-F]{24}$/)) {
      item = await CaseStudy.findById(slug).lean()
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Case study not found' })
    }

    res.status(200).json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
}

// POST /api/case-studies — Admin: Create new case study
exports.createCaseStudy = async (req, res, next) => {
  try {
    const data = { ...req.body }

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`
    }

    // Parse metrics array if stringified
    if (typeof data.metrics === 'string') {
      try { data.metrics = JSON.parse(data.metrics) } catch (e) {}
    }
    if (typeof data.tech === 'string') {
      try { data.tech = JSON.parse(data.tech) } catch (e) { data.tech = data.tech.split(',').map(s => s.trim()) }
    }
    if (typeof data.tags === 'string') {
      try { data.tags = JSON.parse(data.tags) } catch (e) { data.tags = data.tags.split(',').map(s => s.trim()) }
    }

    // Generate slug if not provided
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }

    const newCaseStudy = await CaseStudy.create(data)
    res.status(201).json({ success: true, data: newCaseStudy, message: 'Case Study created successfully' })
  } catch (error) {
    next(error)
  }
}

// PUT /api/case-studies/:id — Admin: Update case study
exports.updateCaseStudy = async (req, res, next) => {
  try {
    const data = { ...req.body }

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`
    }

    if (typeof data.metrics === 'string') {
      try { data.metrics = JSON.parse(data.metrics) } catch (e) {}
    }
    if (typeof data.tech === 'string') {
      try { data.tech = JSON.parse(data.tech) } catch (e) { data.tech = data.tech.split(',').map(s => s.trim()) }
    }
    if (typeof data.tags === 'string') {
      try { data.tags = JSON.parse(data.tags) } catch (e) { data.tags = data.tags.split(',').map(s => s.trim()) }
    }

    const updated = await CaseStudy.findByIdAndUpdate(req.params.id, data, {
      returnDocument: 'after',
      runValidators: true,
    })

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Case study not found' })
    }

    res.status(200).json({ success: true, data: updated, message: 'Case Study updated successfully' })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/case-studies/:id — Admin: Delete case study
exports.deleteCaseStudy = async (req, res, next) => {
  try {
    const item = await CaseStudy.findByIdAndDelete(req.params.id)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Case study not found' })
    }
    res.status(200).json({ success: true, message: 'Case Study deleted successfully' })
  } catch (error) {
    next(error)
  }
}
