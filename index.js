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

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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
app.listen(PORT, () => console.log(`ADVMEN High-Performance Server running on port ${PORT}`))
