const { Router } = require('express')
const {
  get_user_by_user_id,
  create_or_update_user
} = require('../../controllers/user')
const {
  get_friend_ids,
  get_tweets
} = require('../../utils/twitter')

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL
if (!CLIENT_BASE_URL) {
  throw new Error('missing CLIENT_BASE_URL')
}

const router = Router()

router.get('/', (req, res) => {
  const {
    user_id
  } = req.query

  if (!user_id) {
    throw new Error('missing user_id')
  }

  return get_user_by_user_id(user_id)
    .then(user => {
      const {
        user_id,
        screen_name,
        access_token,
        access_token_secret
      } = user

      if (!access_token || !access_token_secret) {
        throw new Error('missing access_token/access_token_secret')
      }

      return get_friend_ids({ access_token, access_token_secret })
        .then(friend_id_array => {
          return create_or_update_user({
            user_id,
            screen_name,
            access_token,
            access_token_secret,
            friends: friend_id_array
          })
        })
        .then(user => {
          const {
            friends: friend_id_array,
            last_synced
          } = user

          const query_user_id_array = [user_id].concat(friend_id_array)
          return get_tweets(query_user_id_array, last_synced, { access_token, access_token_secret })
        })
        .then(tweet_array => {
          console.log(tweet_array)
          return tweet_array
        })
        // .then(tweets_array => {
        //   const tweet_array = tweets_array.flat()
        //   return tweet_array
        // })
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
