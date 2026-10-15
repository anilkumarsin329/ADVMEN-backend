/**
 * routes/mediaRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN — Cloudflare R2 Media Upload & Proxy Router
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const os = require('os')
const sharp = require('sharp')
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

        // Use R2 public URL directly (fast CDN) — fallback to proxy if not set
        const r2PublicUrl = process.env.R2_PUBLIC_URL
        const imageUrl = r2PublicUrl
          ? `${r2PublicUrl}/${fileKey}`
          : `${process.env.API_BASE_URL || ''}/api/media/${fileKey}`

        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully to Cloudflare R2.',
          url: imageUrl,
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

// ── On-the-fly resize (?w=640) → WebP, cached on disk ───────────
// Originals are often 1–2 MB PNG/JPEG straight from phones/ChatGPT. Serving a
// width-limited WebP makes images ~10-30x lighter. Result is cached in tmp dir
// and the browser caches it for a year (URL includes the width).
const ALLOWED_WIDTHS = [160, 320, 480, 640, 800, 1000, 1280, 1600]
const RASTER_RE = /\.(png|jpe?g|webp)$/i
const CACHE_DIR = path.join(os.tmpdir(), 'advmen-img-cache')
const pendingResizes = new Map()

const pickWidth = (raw) => {
  const w = parseInt(raw, 10)
  if (!w || w <= 0) return null
  return ALLOWED_WIDTHS.find((a) => a >= w) || ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1]
}

const loadOriginal = async (fileKey) => {
  try {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: fileKey }))
    if (response.Body && typeof response.Body.transformToByteArray === 'function') {
      return Buffer.from(await response.Body.transformToByteArray())
    }
  } catch (_) {
    // fall through to local disk
  }
  const localFilePath = path.join(__dirname, '../uploads', fileKey)
  if (fs.existsSync(localFilePath)) return fs.promises.readFile(localFilePath)
  return null
}

const getResized = (fileKey, width) => {
  const cacheFile = path.join(CACHE_DIR, `${width}-${fileKey}.webp`)
  if (fs.existsSync(cacheFile)) return Promise.resolve(cacheFile)

  const pendingKey = `${width}:${fileKey}`
  if (pendingResizes.has(pendingKey)) return pendingResizes.get(pendingKey)

  const job = (async () => {
    const original = await loadOriginal(fileKey)
    if (!original) return null
    await fs.promises.mkdir(CACHE_DIR, { recursive: true })
    await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(cacheFile)
    return cacheFile
  })().finally(() => pendingResizes.delete(pendingKey))

  pendingResizes.set(pendingKey, job)
  return job
}

// GET /api/media/:key
// Streaming Proxy endpoint to fetch media from Cloudflare R2 or local disk
router.get('/:key', async (req, res, next) => {
  const fileKey = req.params.key
  const width = pickWidth(req.query.w)
  if (!width || !RASTER_RE.test(fileKey) || fileKey.includes('..')) return next()

  try {
    const file = await getResized(fileKey, width)
    if (!file) return next()
    res.setHeader('Content-Type', 'image/webp')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.sendFile(file)
  } catch (err) {
    console.warn('Image resize failed, serving original:', err.message)
    return next()
  }
})

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
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // 1 year cache

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
