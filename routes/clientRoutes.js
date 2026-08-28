const express = require('express')
const router = express.Router()
const Client = require('../models/Client')
const auth = require('../middleware/auth')

// GET all clients (Public)
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 })
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create a client (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { companyName, logo, description } = req.body
    
    if (!companyName || !logo) {
      return res.status(400).json({ error: 'Company Name and Logo are required' })
    }

    const newClient = new Client({ companyName, logo, description })
    await newClient.save()
    res.status(201).json(newClient)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update a client (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!updatedClient) return res.status(404).json({ error: 'Client not found' })
    res.json(updatedClient)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE a client (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id)
    if (!deletedClient) return res.status(404).json({ error: 'Client not found' })
    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
