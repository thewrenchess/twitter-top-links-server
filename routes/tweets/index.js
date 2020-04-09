const { Router } = require('express')
const get_tweets_router = require('./get-tweets')
const { get_tweets } = require('../../utils/twitter')
const { batch_create_or_update_tweet } = require('../../controllers/tweet')

const router = Router()
router.use('/get-tweets', get_tweets_router)

module.exports = router
