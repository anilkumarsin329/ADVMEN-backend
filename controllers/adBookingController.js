const AdBooking = require('../models/AdBooking')
const AdSpace = require('../models/AdSpace')
const AdCommission = require('../models/AdCommission')
const AdUser = require('../models/AdUser')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { PutObjectCommand } = require('@aws-sdk/client-s3')
const { s3Client, bucketName } = require('../config/r2')

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
})

// Helper for R2 upload
const uploadToR2 = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')
  const fileKey = `${uniqueSuffix}-${cleanFileName}`

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  }))

  const baseUrl = process.env.API_BASE_URL || `https://api.advmen.com`
  return `${baseUrl}/api/media/${fileKey}` 
}

// @desc    Create a booking request (Advertiser)
// @route   POST /api/ad-bookings
// @access  Private (Advertiser)
exports.createBooking = async (req, res) => {
  try {
    const { spaceId, campaignName, startDate, endDate, budget } = req.body

    const space = await AdSpace.findById(spaceId)
    if (!space) {
      return res.status(404).json({ success: false, message: 'Space not found' })
    }

    // Get current commission
    const commissionDoc = await AdCommission.findOne().sort('-createdAt')
    const commissionPct = commissionDoc ? commissionDoc.commissionPct : 15

    // Simplistic pricing calculation (e.g. per month based on duration)
    // For demo, we just use the monthly price
    const spacePrice = space.pricing.monthly
    const platformFee = spacePrice * (commissionPct / 100)
    const ownerPayout = spacePrice - platformFee
    const total = spacePrice

    const booking = await AdBooking.create({
      advertiser: req.user._id,
      space: spaceId,
      campaign: {
        name: campaignName,
        startDate,
        endDate,
        budget,
      },
      pricing: {
        spacePrice,
        commissionPct,
        platformFee,
        ownerPayout,
        total,
      },
      status: 'pending'
    })

    res.status(201).json({ success: true, data: booking })
  } catch (error) {
    console.error('Create Booking Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get advertiser's bookings
// @route   GET /api/ad-bookings/mine
// @access  Private (Advertiser)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await AdBooking.find({ advertiser: req.user._id })
      .populate('space', 'title location spaceType photos')
      .sort('-createdAt')
    res.json({ success: true, data: bookings })
  } catch (error) {
    console.error('Get My Bookings Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Get owner's space bookings
// @route   GET /api/ad-bookings/space/:spaceId
// @access  Private (Owner)
exports.getSpaceBookings = async (req, res) => {
  try {
    const space = await AdSpace.findById(req.params.spaceId)
    if (!space || space.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    const bookings = await AdBooking.find({ space: req.params.spaceId })
      .populate('advertiser', 'name email phone')
      .sort('-createdAt')
    res.json({ success: true, data: bookings })
  } catch (error) {
    console.error('Get Space Bookings Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Approve booking
// @route   PUT /api/ad-bookings/:id/approve
// @access  Private (Owner)
exports.approveBooking = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id).populate('space')
    
    if (booking.space.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    booking.status = 'payment_pending'
    await booking.save()

    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('Approve Booking Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Reject booking
// @route   PUT /api/ad-bookings/:id/reject
// @access  Private (Owner)
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id).populate('space')
    
    if (booking.space.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    booking.status = 'cancelled'
    await booking.save()

    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('Reject Booking Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Create Razorpay Order
// @route   POST /api/ad-bookings/:id/payment/order
// @access  Private (Advertiser)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id)
    if (!booking || booking.advertiser.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    const options = {
      amount: Math.round(booking.pricing.total * 100), // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${booking._id}`,
    }

    const order = await razorpay.orders.create(options)
    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Create Razorpay Order Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Verify Razorpay Payment
// @route   POST /api/ad-bookings/:id/payment/verify
// @access  Private (Advertiser)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    
    const sign = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(sign.toString())
      .digest("hex")

    if (razorpay_signature === expectedSign) {
      const booking = await AdBooking.findById(req.params.id)
      
      booking.status = 'paid'
      booking.payment = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: Date.now()
      }
      await booking.save()

      // Also mark space as occupied
      await AdSpace.findByIdAndUpdate(booking.space, { status: 'occupied' })

      return res.json({ success: true, message: 'Payment verified successfully', data: booking })
    } else {
      return res.status(400).json({ success: false, message: 'Invalid signature sent' })
    }
  } catch (error) {
    console.error('Verify Payment Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Upload creatives
// @route   POST /api/ad-bookings/:id/creatives
// @access  Private (Advertiser)
exports.uploadCreatives = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id)
    if (!booking || booking.advertiser.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToR2(file)
        booking.creatives.push(url)
      }
      booking.status = 'ad_uploaded'
      await booking.save()
    }

    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('Upload Creatives Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Admin verify ad creative
// @route   PUT /api/ad-bookings/:id/admin-verify
// @access  Private (Admin - wait, AdAdmin doesn't have a separate auth in prompt? Assuming Admin JWT)
// We will use existing auth middleware for admin routes
exports.adminVerify = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id)
    booking.status = 'live'
    await booking.save()
    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('Admin Verify Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Complete campaign & process owner payout
// @route   PUT /api/ad-bookings/:id/complete
// @access  Private (Owner or Admin)
exports.completeCampaign = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id).populate('space')
    booking.status = 'completed'
    await booking.save()

    // Add earnings to owner
    const owner = await AdUser.findById(booking.space.owner)
    owner.earnings += booking.pricing.ownerPayout
    await owner.save()

    // Free up space
    await AdSpace.findByIdAndUpdate(booking.space._id, { status: 'available' })

    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('Complete Campaign Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// @desc    Request refund
// @route   POST /api/ad-bookings/:id/refund
// @access  Private (Advertiser)
exports.requestRefund = async (req, res) => {
  try {
    const booking = await AdBooking.findById(req.params.id)
    if (!booking || booking.advertiser.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    booking.refund.requested = true
    booking.refund.reason = req.body.reason
    await booking.save()

    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('Request Refund Error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
