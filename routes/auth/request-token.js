const { Router } = require('express')
const TwitterAPI = require('node-twitter-api')

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

router.get('/', async (req, res) => {
  const twitter = new TwitterAPI({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callback: `${CLIENT_BASE_URL}/auth/redirect`
  })

  return twitter.getRequestToken((error, request_token, request_token_secret, results) => {
    if (error) {
      console.log('error getting request token', error)
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
    
    const auth_url = twitter.getAuthUrl(request_token)
    return res.json({
      auth_url,
      request_token_secret
    })
  })
})

module.exports = router
