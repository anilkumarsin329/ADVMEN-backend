/**
 * utils/seed.js
 * Runs once at server startup — inserts default data only if collections are empty.
 */

const CareerItem = require('../models/CareerItem')
const BlogItem   = require('../models/BlogItem')
const Contact    = require('../models/Contact')

const defaultCareers = [
  {
    title: 'MERN Stack Developer', department: 'Engineering',
    location: 'Gurugram / Remote', type: 'Full-Time',
    experience: ['Fresher (0-1 yr)', 'Junior (1-3 yrs)', 'Senior (3+ yrs)'],
    skills: ['MongoDB', 'Express', 'React', 'Node.js', 'REST APIs'],
    responsibilities: ['Build scalable web apps', 'Write clean reusable code', 'Collaborate with design team'],
    requirements: ['Strong JS fundamentals', 'Git proficiency', 'Problem solving skills'],
    salary: '₹6 - ₹12 LPA',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop&q=80',
    isActive: true,
  },
  {
    title: 'UI/UX Designer', department: 'Design',
    location: 'Gurugram / Hybrid', type: 'Full-Time',
    experience: ['Fresher (0-1 yr)', 'Junior (1-3 yrs)'],
    skills: ['Figma', 'Adobe XD', 'Motion Design', 'Prototyping'],
    responsibilities: ['Design pixel-perfect UI', 'Create design systems', 'Motion mockups'],
    requirements: ['Strong Figma skills', 'Portfolio required', 'Eye for detail'],
    salary: '₹5 - ₹10 LPA',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=675&fit=crop&q=80',
    isActive: true,
  },
]

const defaultBlogs = [
  {
    title: 'React 19 Performance Optimization: A Complete Guide',
    slug: 'react-19-performance-optimization',
    category: 'React Development', author: 'Rajesh Kumar',
    date: 'Dec 15, 2024', readTime: '8 min read',
    excerpt: 'Learn advanced techniques to optimize React 19 applications for maximum performance.',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=675&fit=crop&q=80',
    tags: ['React', 'Performance', 'Optimization'],
    content: 'React 19 brings significant performance improvements, but optimization is still crucial.',
    isActive: true,
  },
  {
    title: "Web Design Trends 2025: What's Next?",
    slug: 'web-design-trends-2025',
    category: 'Design Trends', author: 'Priya Sharma',
    date: 'Dec 10, 2024', readTime: '6 min read',
    excerpt: 'Explore the latest web design trends for 2025.',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=675&fit=crop&q=80',
    tags: ['Design', 'Trends', 'UX'],
    content: '2025 brings exciting new design trends including glassmorphism and AI-powered personalization.',
    isActive: true,
  },
]

const defaultInquiries = [
  {
    name: 'Vikram Mehta',
    email: 'vikram.mehta@techcorp.in',
    phone: '+91 98765 43210',
    subject: 'E-commerce App Development',
    budget: '₹5L - ₹10L',
    timeline: '1-2 Months',
    industry: 'Retail & E-commerce',
    projectType: 'Mobile & Web App',
    goals: 'Build a high-converting multi-vendor marketplace with custom payment gateways.',
    message: 'We are looking for a senior full-stack team to build our mobile app and admin dashboard in React Native & Node.js.',
    status: 'New',
    isStarred: true,
  },
]

const seedDefaults = async () => {
  try {
    const careerCount = await CareerItem.countDocuments()
    if (careerCount === 0) {
      await CareerItem.insertMany(defaultCareers)
      console.log('✅ Default careers seeded')
    }

    const blogCount = await BlogItem.countDocuments()
    if (blogCount === 0) {
      await BlogItem.insertMany(defaultBlogs)
      console.log('✅ Default blogs seeded')
    }

    const contactCount = await Contact.countDocuments()
    if (contactCount === 0) {
      await Contact.insertMany(defaultInquiries)
      console.log('✅ Default contacts seeded')
    }
  } catch (err) {
    console.error('Seed error:', err.message)
  }
}

module.exports = seedDefaults
