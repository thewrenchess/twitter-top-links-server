const { Router } = require('express')
const get_tweets_router = require('./get-tweets')

const router = Router()

router.use('/get-tweets', get_tweets_router)

module.exports = router
