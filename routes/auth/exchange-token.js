const { Router } = require('express')
const TwitterAPI = require('node-twitter-api')
const { create_or_update_user } = require('../../controllers/user')

const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY
if (!TWITTER_CONSUMER_KEY) {
  throw new Error('missing TWITTER_CONSUMER_KEY')
}

const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET
if (!TWITTER_CONSUMER_SECRET) {
  throw new Error('missing TWITTER_CONSUMER_SECRET')
}

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL
if (!CLIENT_BASE_URL) {
  throw new Error('missing CLIENT_BASE_URL')
}

const router = Router()

router.post('/', (req, res) => {
  const {
    oauth_token:  request_token,
    oauth_verifier,
    request_token_secret
  } = req.body

  if (!request_token || !oauth_verifier || !request_token_secret) {
    return res
      .status(400)
      .json({
        error: 'missing oauth_token and/or oauth_verifier'
      })
  }

  const twitter = new TwitterAPI({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callback: `${CLIENT_BASE_URL}/auth/redirect`
  })

  return twitter.getAccessToken(
    request_token,
    request_token_secret,
    oauth_verifier,
    (error, access_token, access_token_secret, results) => {
      if (error) {
        console.log('error getting access token', error)
        const {
          statusCode = 400,
          data = {}
        } = error
        return res
          .status(statusCode)
          .json({
            error: data
          })
      }

      const {
        user_id,
        screen_name
      } = results

      return create_or_update_user({
        user_id,
        screen_name,
        access_token,
        access_token_secret
      })
        .then(user => res.json(user))
        .catch(err => {
          console.log('error creating/updating user', err)
          return res
            .status(400)
            .json({
              error: err.message
            })
        })
    }
  )
})

module.exports = router
