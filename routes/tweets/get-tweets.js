const { Router } = require('express')
const {
  get_user_by_user_id,
  update_user,
  create_or_update_user
} = require('../../controllers/user')
const {
  get_friend_ids,
  get_tweets
} = require('../../utils/twitter')
const {
  find_tweets_by_user_id_array,
  create_tweets
} = require('../../controllers/tweet')

const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL
if (!CLIENT_BASE_URL) {
  throw new Error('missing CLIENT_BASE_URL')
}

const filter_and_cherrypick_tweet_array = (tweet_array) => {
  return tweet_array
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
          hashtags: hashtag_obj_array,
          urls: url_obj_array
        },
        user: {
          id_str: user_id,
          screen_name,
          location
        }
      } = tweet

      const urls = url_obj_array.map(url_obj => url_obj.expanded_url)

      const hashtags = hashtag_obj_array.map(hashtag_obj => hashtag_obj.text)

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
}

const get_new_tweet_array = (user_id_array, last_synced, { access_token, access_token_secret }) => {
  const promise_array = user_id_array
    .map(user_id => {
      return get_tweets(user_id, last_synced, { access_token, access_token_secret })
    })
  return Promise.all(promise_array)
    .then(tweets_array => {
      const tweet_array = tweets_array.flat()
      const filtered_array = filter_and_cherrypick_tweet_array(tweet_array)
      return filtered_array
    })
    .then(tweet_array => {
      return create_tweets(tweet_array)
        .then(() => {
          return tweet_array
        })
    })
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
      if (!user) {
        throw new Error('no user found')
      }
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
          const promise_array = [
            get_new_tweet_array(query_user_id_array, last_synced, { access_token, access_token_secret })
          ]
          if (last_synced) {
            promise_array.push(find_tweets_by_user_id_array(query_user_id_array))
          }
          return Promise.all(promise_array)
            .then(tweets_array => {
              const tweet_array = tweets_array.flat()

              return update_user(user, { last_synced: new Date() })
                .then(() => tweet_array)
            })
        })
    })
    .then(tweet_array => res.json({ tweet_array }))
    .catch(err => {
      return res
        .status(400)
        .json({
          'error': err.message
        })
    })
})

module.exports = router
