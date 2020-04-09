const { Router } = require('express')
const get_tweets_router = require('./get-tweets')
const { get_tweets } = require('../../utils/twitter')

const router = Router()
// user_id_array, last_synced, { access_token, access_token_secret }
router.use('/get-tweets', get_tweets_router)
router.use('/test-tweets', (req, res) => {
  return get_tweets([25073877], undefined, { access_token: '979728732171599872-TZ9sh0DliT2n8voy3XccVNpwirnOdYJ', access_token_secret: 'AzXx0d2rC3LG4YpAPfsT4nh0YUdo5fuptRGVd1QCler3A' })
    .then(() => res.json({ status: 'ok' }))
    .catch(err => {
      return res
        .status(400)
        .json({
          'error': err.message
        })
    })
})

module.exports = router
