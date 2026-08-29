const AdSpace = require('../models/AdSpace')
const { PutObjectCommand } = require('@aws-sdk/client-s3')
const { s3Client, bucketName } = require('../config/r2')

// Helper for R2 upload
const uploadToR2 = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')
  const fileKey = `${uniqueSuffix}-${cleanFileName}`

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  }))

  const baseUrl = process.env.API_BASE_URL || `https://api.advmen.com`
  return `${baseUrl}/api/media/${fileKey}` // Using existing media proxy
}

// @desc    Create an ad space (owner only)
// @route   POST /api/ad-spaces
// @access  Private (Owner)
exports.createSpace = async (req, res) => {
  try {
    const { title, description, spaceType, location, dimensions, pricing, audience } = req.body

    // Parse stringified JSON fields if they come from formData
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location
    const parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions
    const parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing
    const parsedAudience = typeof audience === 'string' ? JSON.parse(audience) : audience

    const photos = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToR2(file)
        photos.push(url)
      }
    }

    const adSpace = await AdSpace.create({
      owner: req.user._id,
      title,
      description,
      spaceType,
      photos,
      location: parsedLocation,
      dimensions: parsedDimensions,
      pricing: parsedPricing,
      audience: parsedAudience,
      status: 'available',
      isApproved: false,
    })

    res.status(201).json({ success: true, data: adSpace })
  } catch (error) {
    console.error('Create Space Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get all ad spaces with filters
// @route   GET /api/ad-spaces
// @access  Public
exports.getSpaces = async (req, res) => {
  try {
    const { city, spaceType, minPrice, maxPrice, status } = req.query

    let query = { isApproved: true }

    if (city) {
      query['location.city'] = { $regex: city.trim(), $options: 'i' }
    }
    if (spaceType) {
      query.spaceType = spaceType
    }
    if (status) {
      query.status = status
    }
    if (minPrice || maxPrice) {
      query['pricing.monthly'] = {}
      if (minPrice) query['pricing.monthly'].$gte = Number(minPrice)
      if (maxPrice) query['pricing.monthly'].$lte = Number(maxPrice)
    }

    const spaces = await AdSpace.find(query).populate('owner', 'name avatar')

    res.json({ success: true, data: spaces })
  } catch (error) {
    console.error('Get Spaces Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get ad space by ID
// @route   GET /api/ad-spaces/:id
// @access  Public
exports.getSpaceById = async (req, res) => {
  try {
    const space = await AdSpace.findById(req.params.id).populate('owner', 'name avatar')
    if (!space) {
      return res.status(404).json({ success: false, message: 'Ad Space not found' })
    }
    res.json({ success: true, data: space })
  } catch (error) {
    console.error('Get Space By ID Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Update ad space
// @route   PUT /api/ad-spaces/:id
// @access  Private (Owner)
exports.updateSpace = async (req, res) => {
  try {
    let space = await AdSpace.findById(req.params.id)

    if (!space) {
      return res.status(404).json({ success: false, message: 'Ad Space not found' })
    }

    if (space.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    space = await AdSpace.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
    res.json({ success: true, data: space })
  } catch (error) {
    console.error('Update Space Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Delete ad space
// @route   DELETE /api/ad-spaces/:id
// @access  Private (Owner)
exports.deleteSpace = async (req, res) => {
  try {
    const space = await AdSpace.findById(req.params.id)

    if (!space) {
      return res.status(404).json({ success: false, message: 'Ad Space not found' })
    }

    if (space.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    await space.deleteOne()
    res.json({ success: true, message: 'Ad Space removed' })
  } catch (error) {
    console.error('Delete Space Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get owner's spaces
// @route   GET /api/ad-spaces/mine
// @access  Private (Owner)
exports.getMySpaces = async (req, res) => {
  try {
    const spaces = await AdSpace.find({ owner: req.user._id }).sort('-createdAt')
    res.json({ success: true, data: spaces })
  } catch (error) {
    console.error('Get My Spaces Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
