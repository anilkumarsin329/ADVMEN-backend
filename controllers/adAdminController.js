const AdSpace = require('../models/AdSpace')
const AdBooking = require('../models/AdBooking')
const AdUser = require('../models/AdUser')
const AdCommission = require('../models/AdCommission')

// @desc    Get all ad users
// @route   GET /api/ad-admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await AdUser.find().select('-password').sort('-createdAt')
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get all ad spaces
// @route   GET /api/ad-admin/spaces
// @access  Private (Admin)
exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await AdSpace.find().populate('owner', 'name email').sort('-createdAt')
    res.json({ success: true, data: spaces })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get all bookings
// @route   GET /api/ad-admin/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await AdBooking.find()
      .populate('advertiser', 'name email')
      .populate({ path: 'space', populate: { path: 'owner', select: 'name email' } })
      .sort('-createdAt')
    res.json({ success: true, data: bookings })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Update commission percentage
// @route   POST /api/ad-admin/commission
// @access  Private (Admin)
exports.updateCommission = async (req, res) => {
  try {
    const { commissionPct } = req.body
    const newCommission = await AdCommission.create({
      commissionPct,
      updatedBy: req.user._id // Using admin user _id
    })
    res.json({ success: true, data: newCommission })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get current commission
// @route   GET /api/ad-admin/commission
// @access  Private (Admin)
exports.getCommission = async (req, res) => {
  try {
    const commission = await AdCommission.findOne().sort('-createdAt')
    res.json({ success: true, data: commission })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Approve ad space
// @route   PUT /api/ad-admin/spaces/:id/approve
// @access  Private (Admin)
exports.approveSpace = async (req, res) => {
  try {
    const space = await AdSpace.findByIdAndUpdate(req.params.id, { isApproved: true, status: 'available' }, { new: true })
    res.json({ success: true, data: space })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Reject ad space
// @route   PUT /api/ad-admin/spaces/:id/reject
// @access  Private (Admin)
exports.rejectSpace = async (req, res) => {
  try {
    const space = await AdSpace.findByIdAndUpdate(req.params.id, { isApproved: false, status: 'rejected' }, { new: true })
    res.json({ success: true, data: space })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Approve ad creatives to go live
// @route   PUT /api/ad-admin/bookings/:id/approve-ad
// @access  Private (Admin)
exports.approveAd = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id)
    if(booking.status === 'ad_uploaded') {
      booking.status = 'live' // Skip admin_verified for simplicity, or just set to live directly
      await booking.save()
    }
    res.json({ success: true, data: booking })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Process refund
// @route   PUT /api/ad-admin/bookings/:id/refund
// @access  Private (Admin)
exports.processRefund = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id)
    booking.status = 'cancelled'
    booking.refund.processedAt = Date.now()
    await booking.save()
    
    await AdSpace.findByIdAndUpdate(booking.space, { status: 'available' })

    res.json({ success: true, data: booking })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get dashboard stats
// @route   GET /api/ad-admin/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const bookings = await AdBooking.find()
    
    let totalRevenue = 0
    let activeCampaigns = 0
    let totalPayouts = 0

    bookings.forEach(b => {
      if (b.status === 'live' || b.status === 'completed') {
        totalRevenue += b.pricing.platformFee || 0
        totalPayouts += b.pricing.ownerPayout || 0
      }
      if (b.status === 'live') {
        activeCampaigns++
      }
    })

    const pendingApprovals = await AdSpace.countDocuments({ isApproved: false })
    const totalSpaces = await AdSpace.countDocuments()
    const totalUsers = await AdUser.countDocuments()

    res.json({
      success: true,
      data: {
        totalRevenue,
        activeCampaigns,
        totalPayouts,
        pendingApprovals,
        totalSpaces,
        totalUsers
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
