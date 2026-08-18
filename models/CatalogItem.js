/**
 * models/CatalogItem.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — Catalog Item Model
 * ─────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose')

const catalogItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Catalog item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    features: {
      type: [String],
      required: [true, 'Features list is required'],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('CatalogItem', catalogItemSchema)
