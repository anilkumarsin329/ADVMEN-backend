require('dotenv').config()
const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const morgan      = require('morgan')
const compression = require('compression')
const cookieParser = require('cookie-parser')

const path        = require('path')

const connectDB    = require('./config/db')
const contactRoutes = require('./routes/contactRoutes')
const adminRoutes   = require('./routes/adminRoutes')
const catalogRoutes = require('./routes/catalogRoutes')
const catalogOrderRoutes = require('./routes/catalogOrderRoutes')
const mediaRoutes   = require('./routes/mediaRoutes')
const serviceRoutes = require('./routes/serviceRoutes')
const portfolioRoutes = require('./routes/portfolioRoutes')
const careerRoutes  = require('./routes/careerRoutes')
const blogRoutes    = require('./routes/blogRoutes')
const applicationRoutes = require('./routes/applicationRoutes')
const chatRoutes        = require('./routes/chatRoutes')
const adAuthRoutes      = require('./routes/adAuthRoutes')
const adSpaceRoutes     = require('./routes/adSpaceRoutes')
const adBookingRoutes   = require('./routes/adBookingRoutes')
const adAdminRoutes     = require('./routes/adAdminRoutes')
const newsletterRoutes  = require('./routes/newsletterRoutes')
const clientRoutes      = require('./routes/clientRoutes')
const caseStudyRoutes   = require('./routes/caseStudyRoutes')
const errorHandler      = require('./middleware/errorHandler')

// Connect to MongoDB
connectDB()

const app = express()

// Serve static uploads with aggressive cache headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.setHeader('Vary', 'Accept-Encoding')
  next()
}, express.static(path.join(__dirname, 'uploads')))

// ── Compression & Security Middleware ────────────────────────
app.use(compression())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

// Deduplicate Access-Control-Allow-Origin header if proxy (Nginx/Cloudflare) also appends CORS headers
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader
  res.setHeader = function (name, value) {
    if (typeof name === 'string' && name.toLowerCase() === 'access-control-allow-origin') {
      if (typeof value === 'string' && value.includes(',')) {
        value = value.split(',')[0].trim()
      }
    }
    return originalSetHeader.call(this, name, value)
  }
  next()
})

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://www.advmen.com',
  'https://advmen.com',
  'http://www.advmen.com',
  'http://advmen.com',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /\.advmen\.com$/.test(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}

// In production, Nginx on api.advmen.com handles CORS headers.
// Enable Express cors() for local development or when explicitly enabled via ENABLE_EXPRESS_CORS environment variable.
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_EXPRESS_CORS === 'true') {
  app.use(cors(corsOptions))
} else {
  // Production preflight OPTIONS handler
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204)
    }
    next()
  })
}

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// ── Routes ────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'ADVMEN API is running 🚀' }))
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Serve sitemap.xml and robots.txt dynamically or from public directory
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml')
  const sitemapPath = path.join(__dirname, '../frontend/public/sitemap.xml')
  res.sendFile(sitemapPath, (err) => {
    if (err) {
      const today = new Date().toISOString().split('T')[0]
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://advmen.com/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://advmen.com/about</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://advmen.com/services</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://advmen.com/work</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://advmen.com/blog</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://advmen.com/catalog</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://advmen.com/contact</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://advmen.com/careers</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://advmen.com/ad-space</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://advmen.com/privacy-policy</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://advmen.com/terms-of-service</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`)
    }
  })
})

app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain')
  const robotsPath = path.join(__dirname, '../frontend/public/robots.txt')
  res.sendFile(robotsPath, (err) => {
    if (err) {
      res.send("User-agent: *\nAllow: /\n\nSitemap: https://advmen.com/sitemap.xml\n")
    }
  })
})

app.use('/api/contact', contactRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/catalog-orders', catalogOrderRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/careers', careerRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/ad-auth', adAuthRoutes)
app.use('/api/ad-spaces', adSpaceRoutes)
app.use('/api/ad-bookings', adBookingRoutes)
app.use('/api/ad-admin', adAdminRoutes)
app.use('/api/newsletter', newsletterRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/case-studies', caseStudyRoutes)

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`ADVMEN High-Performance Server running on port ${PORT}`)

    // Keep-alive: ping self every 14 min to prevent Render free tier sleep (sleeps after 15 min)
    if (process.env.NODE_ENV === 'production') {
      const SELF_URL = process.env.RENDER_EXTERNAL_URL || 'https://advmen-backend.onrender.com'
      setInterval(() => {
        fetch(`${SELF_URL}/api/health`).catch(() => {})
      }, 14 * 60 * 1000)
    }
})
