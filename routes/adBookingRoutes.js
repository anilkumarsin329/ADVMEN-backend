const express = require('express')
const router = express.Router()
const multer = require('multer')
const {
  createBooking,
  getMyBookings,
  getSpaceBookings,
  approveBooking,
  rejectBooking,
  createRazorpayOrder,
  verifyPayment,
  uploadCreatives,
  requestRefund
} = require('../controllers/adBookingController')
const { adAuth, authorizeAdRoles } = require('../middleware/adAuth')

const upload = multer({ storage: multer.memoryStorage() })

// Advertiser routes
router.post('/', adAuth, authorizeAdRoles('advertiser'), createBooking)
router.get('/mine', adAuth, authorizeAdRoles('advertiser'), getMyBookings)
router.post('/:id/payment/order', adAuth, authorizeAdRoles('advertiser'), createRazorpayOrder)
router.post('/:id/payment/verify', adAuth, authorizeAdRoles('advertiser'), verifyPayment)
router.post('/:id/creatives', adAuth, authorizeAdRoles('advertiser'), upload.array('creatives', 5), uploadCreatives)
router.post('/:id/refund', adAuth, authorizeAdRoles('advertiser'), requestRefund)

// Owner routes
router.get('/space/:spaceId', adAuth, authorizeAdRoles('owner'), getSpaceBookings)
router.put('/:id/approve', adAuth, authorizeAdRoles('owner'), approveBooking)
router.put('/:id/reject', adAuth, authorizeAdRoles('owner'), rejectBooking)

module.exports = router
