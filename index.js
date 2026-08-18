require('dotenv').config()
const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const morgan      = require('morgan')
const compression = require('compression')

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
const errorHandler  = require('./middleware/errorHandler')

// Connect to MongoDB then seed defaults once
const seedDefaults = require('./utils/seed')
connectDB().then(() => seedDefaults())

const app = express()

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── Compression & Security Middleware ────────────────────────
app.use(compression())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

// CORS — support multiple origins (local + production advmen.com)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://www.advmen.com',
  'https://advmen.com',
  'http://www.advmen.com',
  'http://advmen.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, EC2 health checks)
    if (!origin) return callback(null, true)
    
    if (
      allowedOrigins.includes(origin) ||
      /advmen\.com$/.test(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      return callback(null, true)
    }
    // Allow origin to prevent crashing production sites
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

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

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`ADVMEN High-Performance Server running on port ${PORT}`))
