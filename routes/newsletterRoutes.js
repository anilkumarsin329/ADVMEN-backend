const express = require('express')
const router = express.Router()
const {
  subscribe,
  getSubscribers,
  deleteSubscriber
} = require('../controllers/newsletterController')
const auth = require('../middleware/auth') // Changed from authMiddleware

// Public route to subscribe
router.post('/subscribe', subscribe)

// Admin routes to view and delete subscribers
router.route('/')
  .get(auth, getSubscribers)

router.route('/:id')
  .delete(auth, deleteSubscriber)

module.exports = router
