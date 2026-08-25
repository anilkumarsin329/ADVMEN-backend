const express = require('express')
const router = express.Router()
const CatalogOrder = require('../models/CatalogOrder')
const auth = require('../middleware/auth')
const { sendBrevoEmail } = require('../utils/sendEmail')

// POST /api/catalog-orders — Public, create new order
router.post('/', async (req, res, next) => {
  try {
    const { clientName, clientEmail, clientPhone, clientCompany, requirements, items, totalAmount } = req.body

    if (!clientName || !clientEmail || !clientPhone || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const newOrder = new CatalogOrder({
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      requirements,
      items,
      totalAmount
    })

    const savedOrder = await newOrder.save()

    // Send email notification to Admin asynchronously (don't block the request)
    const emailHtml = `
      <h3>New Catalog Booking</h3>
      <p><strong>Name:</strong> ${clientName}</p>
      <p><strong>Email:</strong> ${clientEmail}</p>
      <p><strong>Phone:</strong> ${clientPhone}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
      <p><strong>Requirements:</strong> ${requirements || 'N/A'}</p>
      <br />
      <h4>Items:</h4>
      <ul>
        ${items.map(i => `<li>${i.quantity}x ${i.name} (₹${i.price})</li>`).join('')}
      </ul>
    `
    sendBrevoEmail({
      toEmail: process.env.EMAIL_USER || 'admin@advmen.com',
      toName: 'Admin',
      subject: `New Catalog Booking from ${clientName}`,
      htmlContent: emailHtml
    }).catch(err => console.error('Failed to send order email:', err))

    return res.status(201).json({
      success: true,
      message: 'Order submitted successfully',
      order: savedOrder,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/catalog-orders — Admin, fetch all orders
router.get('/', auth, async (req, res, next) => {
  try {
    const orders = await CatalogOrder.find().populate('items.catalogItemId', 'image').sort({ createdAt: -1 }).lean()
    return res.status(200).json(orders)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/catalog-orders/:id — Admin, update order status
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }

    const order = await CatalogOrder.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    order.status = status
    const updatedOrder = await order.save()

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/catalog-orders/:id - Admin, delete order
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deletedOrder = await CatalogOrder.findByIdAndDelete(req.params.id)
    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    })
  } catch (err) {
    next(err)
  }
})


module.exports = router
