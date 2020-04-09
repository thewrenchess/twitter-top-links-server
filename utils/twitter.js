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
  console.log('getting friend ids')
  const url = `${TWITTER_API_URL}/${TWITTER_API_VERSION}/friends/ids.json`
  const params = build_params(access_token)

  const axios = make_retry_axios({}, MAX_RETRIES, SLEEP_MS)
  const user_id_array = []
  let next_cursor = 0

  while (next_cursor >= 0) {
    const query_params = { count: 5 }
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

const get_tweets = async (user_id_array, last_synced, { access_token, access_token_secret }) => {
  const url = `${TWITTER_API_URL}/${TWITTER_API_VERSION}/statuses/user_timeline.json`
  console.log('getting tweets', url)
  const params = build_params(access_token)


  const axios = make_retry_axios({}, MAX_RETRIES, SLEEP_MS)
  const total_tweet_array = []
  const seven_days_ago = new Date() - 7 * 24 * 60 * 60
  if (last_synced) {
    last_synced = new Date()
  }
  const datetime_to_stop = last_synced > seven_days_ago ? last_synced : seven_days_ago

  for (let user_id of user_id_array) {
    let since_id = 0

    while (since_id >= 0) {
      const query_params = { user_id }
      if (since_id > 0) {
        query_params.since_id = since_id
      }
  
      console.log('hello', query_params)
  
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
        console.log(`received ${data.length} tweets`)
        const tweet_array = data.filter(tweet => {
          const created_at = new Date(tweet.created_at)
          return created_at > datetime_to_stop
        })
        if (tweet_array.length > 0 && tweet_array.length === data.length) {
          total_tweet_array.concat(tweet_array)
          console.log(`total ${total_tweet_array.length} tweets`)
          since_id = data[data.length - 1].id
        } else {
          break
        }
      } catch (err) {
        const eror_data_array = err.response.data || []
        const has_code_34 = error_data_array.some(error_data => {
          const code = error_data.code || -1
          return code === 34
        })

        if (!has_code_34) {
          throw new Error(err)
        }
        
        break
      }
    }
  }

  return total_tweet_array
}

module.exports = {
  get_friend_ids,
  get_tweets
}
