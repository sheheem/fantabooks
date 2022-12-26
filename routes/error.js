const express = require('express')
const error = require('../controllers/error')
const router = express.Router()

router.use(error.useError)



module.exports = router