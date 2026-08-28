const Newsletter = require('../models/Newsletter')
const { sendNewsletterWelcomeEmail } = require('../utils/sendEmail')

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' })
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email })
    if (existingSubscriber) {
      if (existingSubscriber.status === 'Unsubscribed') {
        existingSubscriber.status = 'Active'
        await existingSubscriber.save()
        sendNewsletterWelcomeEmail(email).catch(err => console.error('[Brevo Error]', err))
        return res.status(200).json({ success: true, data: existingSubscriber, message: 'Resubscribed successfully' })
      }
      return res.status(200).json({ success: true, message: 'Email is already subscribed' })
    }

    const subscriber = await Newsletter.create({ email })
    sendNewsletterWelcomeEmail(email).catch(err => console.error('[Brevo Error]', err))
    res.status(201).json({ success: true, data: subscriber, message: 'Subscribed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// @desc    Get all subscribers
// @route   GET /api/newsletter
// @access  Private/Admin
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: subscribers })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}

// @desc    Delete a subscriber
// @route   DELETE /api/newsletter/:id
// @access  Private/Admin
exports.deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id)
    
    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' })
    }

    await subscriber.deleteOne()
    res.status(200).json({ success: true, data: {} })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
