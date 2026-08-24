const express = require('express')
const router = express.Router()
const {
  getAllUsers,
  getAllSpaces,
  getAllBookings,
  updateCommission,
  getCommission,
  approveSpace,
  rejectSpace,
  approveAd,
  processRefund,
  getDashboardStats
} = require('../controllers/adAdminController')
const auth = require('../middleware/auth') // Main admin auth

router.use(auth) // All admin routes protected by main auth

router.get('/users', getAllUsers)
router.get('/spaces', getAllSpaces)
router.get('/bookings', getAllBookings)

router.post('/commission', updateCommission)
router.get('/commission', getCommission)

router.put('/spaces/:id/approve', approveSpace)
router.put('/spaces/:id/reject', rejectSpace)
router.put('/bookings/:id/approve-ad', approveAd)
router.put('/bookings/:id/refund', processRefund)

router.get('/stats', getDashboardStats)

module.exports = router
