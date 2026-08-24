const express = require('express')
const router = express.Router()
const multer = require('multer')
const { createSpace, getSpaces, getSpaceById, updateSpace, deleteSpace, getMySpaces } = require('../controllers/adSpaceController')
const { adAuth, authorizeAdRoles } = require('../middleware/adAuth')

const upload = multer({ storage: multer.memoryStorage() })

router.route('/')
  .get(getSpaces)
  .post(adAuth, authorizeAdRoles('owner'), upload.array('photos', 10), createSpace)

router.get('/mine', adAuth, authorizeAdRoles('owner'), getMySpaces)

router.route('/:id')
  .get(getSpaceById)
  .put(adAuth, authorizeAdRoles('owner'), updateSpace)
  .delete(adAuth, authorizeAdRoles('owner'), deleteSpace)

module.exports = router
