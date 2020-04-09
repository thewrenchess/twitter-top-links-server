const { Router } = require('express')
const auth_router = require('./auth')
const tweets_router = require('./tweets')

const router = Router()

router.use('/auth', auth_router)
router.use('/tweets', tweets_router)
router.use('/health-check', (req, res) => res.json({ status: 'ok' }))

module.exports = router
