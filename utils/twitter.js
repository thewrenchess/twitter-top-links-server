const { make_retry_axios } = require('./retry-axios')
const { now } = require('unix-timestamp')
const oauth_signature = require('oauth-signature')
const { v4: uuid } = require('uuid')

const MAX_RETRIES = 5
const SLEEP_MS = 1000

const TWITTER_API_URL = process.env.TWITTER_API_URL || 'https://api.twitter.com'
const TWITTER_API_VERSION = process.env.TWITTER_API_VERSION || 1.1

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

const create_oauth_signature = (method, url, params, access_token_secret) => {
  return oauth_signature.generate(
    method,
    url,
    params,
    TWITTER_CONSUMER_SECRET,
    access_token_secret
  )
}

const build_oauth_str = (method, url, params, access_token_secret) => {
  const {
    oauth_consumer_key,
    oauth_nonce,
    oauth_signature_method,
    oauth_timestamp,
    oauth_token,
    oauth_version
  } = params

  return 'OAuth '
    + `oauth_consumer_key=${oauth_consumer_key},`
    + `oauth_token=${oauth_token},`
    + `oauth_signature_method=${oauth_signature_method},`
    + `oauth_timestamp=${oauth_timestamp},`
    + `oauth_nonce=${oauth_nonce},`
    + `oauth_version=${oauth_version},`
    + `oauth_signature=${create_oauth_signature(method, url, params, access_token_secret)}`
 }

const build_params = (access_token) => {
  return {
    oauth_consumer_key: TWITTER_CONSUMER_KEY,
    oauth_nonce: uuid().slice(0, 8),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(now()),
    oauth_token: access_token,
    oauth_version: '1.0'
  }
}

const get_friend_ids = async ({ access_token, access_token_secret }) => {
  const url = `${TWITTER_API_URL}/${TWITTER_API_VERSION}/friends/ids.json`
  const params = build_params(access_token)

  const axios = make_retry_axios({}, MAX_RETRIES, SLEEP_MS)
  const user_id_array = []
  let next_cursor = 0

  while (next_cursor >= 0) {
    const query_params = { stringify_ids: true }
    if (next_cursor > 0) {
      query_params.cursor = next_cursor
    }

    const response = await axios.get(
      url,
      {
        headers: {
          Authorization: build_oauth_str(
            'GET',
            url,
            { ...params, ...query_params },
            access_token_secret
          )
        },
        params: query_params
      }
    )
    const data = response.data || {}
    const ids = data.ids || []
    user_id_array.push(...ids)
    next_cursor = data.next_cursor || -1
  }

  return user_id_array
}

const get_tweets = async (user_id, last_synced, { access_token, access_token_secret }) => {
  const url = `${TWITTER_API_URL}/${TWITTER_API_VERSION}/statuses/user_timeline.json`
  const params = build_params(access_token)


  const axios = make_retry_axios({}, MAX_RETRIES, SLEEP_MS)
  let total_tweet_array = []
  let seven_days_ago = new Date()
  seven_days_ago.setDate(seven_days_ago.getDate() - 7)
  const datetime_to_stop = (last_synced && last_synced > seven_days_ago) ? last_synced : seven_days_ago

  let max_id = 0

  while (max_id >= 0) {
    const query_params = { user_id }
    if (max_id > 0) {
      query_params.max_id = max_id
    }

    try {
      const response = await axios.get(
        url,
        {
          headers: {
            Authorization: build_oauth_str(
              'GET',
              url,
              { ...params, ...query_params },
              access_token_secret
            )
          },
          params: query_params
        }
      )

      const data = response.data
      if (!data || !data.length) {
        break
      }
      const tweet_array = data.filter(tweet => {
        const created_at = new Date(tweet.created_at)
        return created_at > datetime_to_stop
      })
      if (tweet_array.length > 0) {
        total_tweet_array = total_tweet_array.concat(tweet_array)
      }
      if (tweet_array.length === data.length) {
        const id_str = data[data.length - 1].id_str
        const id_str_len = id_str.length
        let last_digit = parseInt(id_str.slice(-1)) - 1
        if (last_digit < 0) {
          last_digit = 9
        }
        max_id = `${id_str.slice(0, id_str_len - 1)}${last_digit}`
      } else {
        break
      }
    } catch (err) {
      const error_response = err.reponse || {}
      const eror_data_array = error_response.data || []
      const has_code_34 = eror_data_array.some(error_data => {
        const code = error_data.code || -1
        return code === 34
      })

      if (!has_code_34) {
        throw new Error(err)
      }
      
      break
    }
  }

  return total_tweet_array
}

module.exports = {
  get_friend_ids,
  get_tweets
}
