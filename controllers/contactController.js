/**
 * controllers/contactController.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Contact Inquiry Controller
 * High-performance controller with .lean() Mongoose queries
 * ─────────────────────────────────────────────────────────────
 */

const Contact = require('../models/Contact')
const { sendContactInquiryEmail } = require('../utils/sendEmail')

// POST /api/contact — Public: Submit contact form
const submitContact = async (req, res, next) => {
  try {
    const { name, email, message } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' })
    }
    const contact = await Contact.create(req.body)

    // Trigger Brevo confirmation email asynchronously
    sendContactInquiryEmail(req.body).catch(err => console.error('[Brevo Contact Email Error]', err))

    res.status(201).json({ success: true, message: 'Message received', data: contact })
  } catch (error) {
    next(error)
  }
}

// GET /api/contact — Admin / Public: Get all contacts (.lean query)
const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean()
    res.status(200).json({ success: true, count: contacts.length, data: contacts })
  } catch (error) {
    next(error)
  }
}

// PATCH /api/contact/:id/status — Admin: Update contact status
const updateContactStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' })
    }
    res.status(200).json({ success: true, data: contact })
  } catch (error) {
    next(error)
  }
}

// PATCH /api/contact/:id/star — Admin: Toggle star status
const toggleStarContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' })
    }
    contact.isStarred = !contact.isStarred
    await contact.save()
    res.status(200).json({ success: true, data: contact })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/contact/:id — Admin: Delete contact inquiry
const deleteContact = async (req, res, next) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' })
    }
    res.status(200).json({ success: true, message: 'Inquiry deleted' })
  } catch (error) {
    next(error)
  }
}

module.exports = { 
  submitContact, 
  getContacts, 
  updateContactStatus, 
  toggleStarContact, 
  deleteContact 
}
