const { Router } = require('express')
const request_token_router = require('./request-token')
const exchange_token_router = require('./exchange-token')

const router = Router()

router.use('/request-token', request_token_router)
router.use('/exchange-token', exchange_token_router)

module.exports = router
