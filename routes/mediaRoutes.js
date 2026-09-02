/**
 * routes/mediaRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Cloudflare R2 Media Upload & Proxy Router
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { s3Client, bucketName } = require('../config/r2')
const auth = require('../middleware/auth')

// Setup Multer Memory Storage (keep file buffer in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  }
})

// POST /api/media/upload — Admin JWT protected
router.post('/upload', auth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' })
      }
      return res.status(400).json({ success: false, message: err.message || 'File upload error.' })
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' })
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const cleanFileName = req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')
    const fileKey = `${uniqueSuffix}-${cleanFileName}`

    if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      try {
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }))

        const baseUrl = process.env.API_BASE_URL || ''
        const proxyUrl = `${baseUrl}/api/media/${fileKey}`

        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully to Cloudflare R2.',
          url: proxyUrl,
          key: fileKey,
        })
      } catch (r2Err) {
        console.warn('R2 upload failed, falling back to local disk:', r2Err.message)
      }
    }

    // Local disk fallback
    const uploadsDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const localFilePath = path.join(uploadsDir, fileKey)
    fs.writeFileSync(localFilePath, req.file.buffer)

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully to local storage.',
      url: `/uploads/${fileKey}`,
      key: fileKey,
    })
  } catch (err) {
    console.error('Upload failed:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to upload media file.',
      error: err.message,
    })
  }
})

// GET /api/media/:key
// Streaming Proxy endpoint to fetch media from Cloudflare R2 or local disk
router.get('/:key', async (req, res) => {
  try {
    const fileKey = req.params.key

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    })

    const response = await s3Client.send(getCommand)

    // Set correct Content-Type matching the stored file
    res.setHeader('Content-Type', response.ContentType || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000') // 1 year cache

    // Stream object to the response body
    if (response.Body && typeof response.Body.pipe === 'function') {
      response.Body.pipe(res)
    } else if (response.Body && typeof response.Body.transformToByteArray === 'function') {
      // Fallback for newer JS runtimes/SDKs
      const byteArray = await response.Body.transformToByteArray()
      res.send(Buffer.from(byteArray))
    } else {
      return res.status(500).json({ success: false, message: 'Readable stream not supported.' })
    }
  } catch (err) {
    // Check local fallback file
    const localFilePath = path.join(__dirname, '../uploads', req.params.key)
    if (fs.existsSync(localFilePath)) {
      return res.sendFile(localFilePath)
    }
    console.error('R2 streaming failed:', err.message)
    if (err.name === 'NoSuchKey') {
      return res.status(404).json({ success: false, message: 'Image file not found.' })
    }
    return res.status(500).json({ success: false, message: 'Failed to stream media file.', error: err.message })
  }
})

module.exports = router
