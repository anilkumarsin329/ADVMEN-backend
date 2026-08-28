/**
 * controllers/caseStudyController.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Case Study Controller
 * ─────────────────────────────────────────────────────────────
 */

const CaseStudy = require('../models/CaseStudy')

// Initial seed data if collection is empty
const initialSeedData = [
  {
    title: 'E-Commerce Platform Redesign',
    slug: 'case-study-1',
    client: 'TechStore Inc.',
    category: 'Web Development',
    summary: 'Complete e-commerce platform redesign with modern UI, optimized checkout flow, and mobile-first performance.',
    description: 'A complete end-to-end transformation of TechStore Inc.\'s online shopping experience. Designed with a custom Next.js frontend, microservices backend, and seamless payment Gateway integration.',
    challenge: 'The legacy online store experienced slow load times exceeding 5 seconds, high drop-off rates on mobile checkouts, and low conversion rates.',
    solution: 'Engineered a modern headless e-commerce store with server-side rendering, instant page transitions, and streamlined 1-click checkout.',
    image: '/Image/advmen_service3.jpeg',
    metrics: [
      { value: '+15%', label: 'Conversion Rate' },
      { value: '30%', label: 'Faster Load' },
    ],
    tech: ['React', 'Next.js', 'Tailwind CSS', 'Node.js', 'Stripe'],
    tags: ['E-Commerce', 'Web Development', 'UI/UX'],
    order: 1,
    status: 'Active',
  },
  {
    title: 'Digital Marketing Campaign',
    slug: 'case-study-2',
    client: 'Fashion Brand Co.',
    category: 'Digital Marketing',
    summary: 'Integrated digital marketing campaign driving multi-channel lead acquisition and brand awareness.',
    description: 'Multi-channel digital marketing acceleration strategy combining high-converting social media ads, search engine marketing, and influencer partnerships.',
    challenge: 'High customer acquisition cost across social platforms and fragmented audience targeting.',
    solution: 'Designed hyper-targeted conversion funnels, A/B tested creative ad sets, and optimized retargeting campaigns.',
    image: '/Image/advmen_service6.jpeg',
    metrics: [
      { value: '+40%', label: 'Monthly Leads' },
      { value: '+25%', label: 'Social Engagement' },
    ],
    tech: ['Google Ads', 'Meta Ads', 'SEO', 'Analytics', 'Funnel Design'],
    tags: ['Digital Marketing', 'Growth', 'Lead Gen'],
    order: 2,
    status: 'Active',
  },
  {
    title: 'Mobile App Development',
    slug: 'case-study-3',
    client: 'FitLife Technologies',
    category: 'App Development',
    summary: 'Cross-platform fitness mobile application built with real-time tracking and active community features.',
    description: 'Feature-packed iOS and Android mobile app empowering users to track daily workouts, sync wearable devices, and connect with fitness coaches.',
    challenge: 'Need for high-performance offline activity tracking and seamless real-time device synchronization.',
    solution: 'Developed a cross-platform React Native application utilizing SQLite local storage and WebSockets for live community leaderboards.',
    image: '/Image/advmen_service1.jpeg',
    metrics: [
      { value: '500+', label: 'App Downloads' },
      { value: '4.5/5', label: 'Store Rating' },
    ],
    tech: ['React Native', 'Firebase', 'GraphQL', 'HealthKit'],
    tags: ['App Development', 'Mobile', 'Fitness'],
    order: 3,
    status: 'Active',
  },
  {
    title: 'SEO & Content Strategy',
    slug: 'case-study-4',
    client: 'Global Tech Solutions',
    category: 'SEO & Content',
    summary: 'Technical SEO overhaul, keyword mapping, and content optimization positioning client on Page 1.',
    description: 'Comprehensive organic search growth engine built through technical site auditing, site speed optimization, and authority-building content hubs.',
    challenge: 'Low organic keyword indexation and competition against domain-heavy industry giants.',
    solution: 'Restructured XML sitemaps, fixed schema markup errors, and launched 20+ keyword-focused pillar articles.',
    image: '/Image/advmen_service9.jpeg',
    metrics: [
      { value: '+60%', label: 'Organic Traffic' },
      { value: 'Page 1', label: 'Keyword Rankings' },
    ],
    tech: ['Technical SEO', 'Content Strategy', 'Ahrefs', 'Search Console'],
    tags: ['SEO', 'Content', 'Growth'],
    order: 4,
    status: 'Active',
  },
  {
    title: 'Brand Identity & Design System',
    slug: 'case-study-5',
    client: 'StartUp Ventures Inc.',
    category: 'Branding',
    summary: 'Complete brand guidelines, visual identity design system, and UI kit for high-impact market launch.',
    description: 'Unified visual brand system encompassing logo design, color palettes, iconography, typography, and interactive UI components in Figma.',
    challenge: 'Fragmented brand assets across web, pitch decks, and marketing collaterals.',
    solution: 'Crafted an extensible design system with clear usage guidelines and tokenized UI components.',
    image: '/Image/advmen_service4.jpeg',
    metrics: [
      { value: '5+', label: 'Brand Assets' },
      { value: '2 Weeks', label: 'Fast Delivery' },
    ],
    tech: ['Figma', 'Brand Strategy', 'UI/UX Design', 'Design Systems'],
    tags: ['Branding', 'Design System', 'UI/UX'],
    order: 5,
    status: 'Active',
  },
  {
    title: 'Video Production & Media',
    slug: 'case-study-6',
    client: 'Premium Lifestyle Brand',
    category: 'Media Production',
    summary: 'High-converting video production and lifestyle product photography for social media campaigns.',
    description: 'Cinematic 4K promo video production and product photography designed for high-performing ad creatives and website visual banners.',
    challenge: 'Generic stock photography failing to showcase unique product craftsmanship.',
    solution: 'On-location studio shoot, color grading, and dynamic motion graphics editing.',
    image: '/Image/advmen_service5.jpeg',
    metrics: [
      { value: '5K+', label: 'Video Views' },
      { value: '+20%', label: 'Engagement Lift' },
    ],
    tech: ['Video Production', '4K Cinema', 'Color Grading', 'Motion Graphics'],
    tags: ['Media Production', 'Video', 'Creative'],
    order: 6,
    status: 'Active',
  },
]

// GET /api/case-studies — Public: Get active case studies
exports.getCaseStudies = async (req, res, next) => {
  try {
    let count = await CaseStudy.countDocuments()
    if (count === 0) {
      await CaseStudy.insertMany(initialSeedData)
    }

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
    let count = await CaseStudy.countDocuments()
    if (count === 0) {
      await CaseStudy.insertMany(initialSeedData)
    }

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
      new: true,
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
