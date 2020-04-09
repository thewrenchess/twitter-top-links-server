const { Router } = require('express')
const get_tweets_router = require('./get-tweets')
const { get_tweets } = require('../../utils/twitter')
const { batch_create_or_update_tweet } = require('../../controllers/tweet')

const router = Router()
router.use('/get-tweets', get_tweets_router)
router.use('/test-tweets', (req, res) => {
  return get_tweets([25073877], undefined, { access_token: '979728732171599872-TZ9sh0DliT2n8voy3XccVNpwirnOdYJ', access_token_secret: 'AzXx0d2rC3LG4YpAPfsT4nh0YUdo5fuptRGVd1QCler3A' })
    .then(tweet_array => {
      console.log(`got ${tweet_array.length} tweet`)
      const url_tweet_array = tweet_array
        .filter(tweet => {
          const {
            entities: {
              urls: url_obj_array
            }    
          } = tweet
          return url_obj_array.some(url_obj => {
            return !(/^https\:\/\/(www\.)?twitter\.com.*/.test(url_obj.expanded_url))
          })
        })
        .map(tweet => {
          const {
            created_at: tweet_created_at,
            id_str: tweet_id,
            entities: {
              hashtags,
              urls: url_obj_array
            },
            user: {
              id_str: user_id,
              screen_name,
              location
            }
          } = tweet

          const urls = url_obj_array
            .map(url_obj => url_obj.expanded_url)
  
          return {
            tweet_created_at,
            tweet_id,
            hashtags,
            urls,
            user_id,
            screen_name,
            location
          }
        })

      console.log(`need to store ${url_tweet_array.length} tweets`)
      return batch_create_or_update_tweet(url_tweet_array)
    })
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
