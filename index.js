require('dotenv').config()
const express     = require('express')
const cors        = require('cors')
const helmet      = require('helmet')
const morgan      = require('morgan')
const compression = require('compression')

const connectDB    = require('./config/db')
const contactRoutes = require('./routes/contactRoutes')
const adminRoutes   = require('./routes/adminRoutes')
const catalogRoutes = require('./routes/catalogRoutes')
const mediaRoutes   = require('./routes/mediaRoutes')
const serviceRoutes = require('./routes/serviceRoutes')
const portfolioRoutes = require('./routes/portfolioRoutes')
const careerRoutes  = require('./routes/careerRoutes')
const blogRoutes    = require('./routes/blogRoutes')
const errorHandler  = require('./middleware/errorHandler')

// Connect to MongoDB then seed defaults once
const seedDefaults = require('./utils/seed')
connectDB().then(() => seedDefaults())

const app = express()

// ── Compression & Security Middleware ────────────────────────
app.use(compression())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

// CORS — support multiple origins (local + production)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, EC2 health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  credentials: true,
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

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`ADVMEN High-Performance Server running on port ${PORT}`))
