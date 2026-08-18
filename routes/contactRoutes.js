/**
 * routes/contactRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Contact Inquiry API Routes
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()
const { 
  submitContact, 
  getContacts, 
  updateContactStatus, 
  toggleStarContact, 
  deleteContact 
} = require('../controllers/contactController')
const auth = require('../middleware/auth')

router.post('/', submitContact)
router.get('/', getContacts)
router.get('/all', auth, getContacts)
router.patch('/:id/status', auth, updateContactStatus)
router.patch('/:id/star', auth, toggleStarContact)
router.delete('/:id', auth, deleteContact)

module.exports = router
