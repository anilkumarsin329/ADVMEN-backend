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
const errorHandler  = require('./middleware/errorHandler')

// Connect to MongoDB
connectDB()

const app = express()

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── Compression & Security Middleware ────────────────────────
app.use(compression())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

// CORS — must be registered BEFORE all routes including multer
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

// CORS handled by Nginx in production
// Keep for local development only
if (process.env.NODE_ENV !== 'production') {
  app.options('/{*path}', cors(corsOptions))
  app.use(cors(corsOptions))
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

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`ADVMEN High-Performance Server running on port ${PORT}`))
