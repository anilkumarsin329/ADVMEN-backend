const mongoose = require('mongoose')

const catalogOrderSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientPhone: { type: String, required: true },
  clientCompany: { type: String, default: '' },
  requirements: { type: String, default: '' },
  items: [
    {
      catalogItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogItem' },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 }
    }
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true })

module.exports = mongoose.model('CatalogOrder', catalogOrderSchema)
