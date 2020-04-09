const Tweet = require('../models/tweet')

const find_tweets = (user_id) => {
  let seven_days_ago = new Date()
  seven_days_ago.setDate(seven_days_ago.getDate() - 7)

  return Tweet
    .find({
      user_id,
      tweet_created_at: { $gt: seven_days_ago }
    })
    .then(tweets => tweets || [])
    .catch(err => {
      throw new Error(err)
    })
}

const create_tweet = (_tweet) => {
  const tweet = new Tweet(_tweet)

  return tweet
    .save()
    .then(tweet => tweet)
    .catch(err => {
      throw new Error(err)
    })
}

const update_tweet = (tweet, _tweet) => {
  return Tweet
    .findOneAndUpdate(
      { tweet_id: tweet.tweet_id },
      { $set: _tweet },
      { new: true }
    )
    .then(tweet => tweet)
    .catch(err => {
      throw new Error(err)
    })
}

const sleep = () => {
  const sleep_ms = 60 * 1000

  return new Promise((resolve) => {
    return setTimeout(() => {
      resolve({})
    }, sleep_ms)
  })
}

const create_or_update_tweet = async (_tweet) => {
  return Tweet
    .findOne({ tweet_id: _tweet.tweet_id })
    .then(tweet => {
      if (tweet) {
        return update_tweet(tweet, _tweet)
      }
      return create_tweet(_tweet)
    })
    .catch(err => {
      throw new Error(err)
    })
}

const batch_create_or_update_tweet = async (tweet_array) => {
  try {
    const tweet_array_to_split = [...tweet_array]
    const batch_tweet_array = []

    while (tweet_array_to_split.length) {
      batch_tweet_array.push(tweet_array_to_split.splice(0, 80))
    }

    for (let i = 0; i < batch_tweet_array.length; i++) {
      if (i) {
        sleep()
      }

      const tweet_array = batch_tweet_array[i]
      const promise_array = tweet_array.map(tweet => create_or_update_tweet(tweet))
      await Promise.all(promise_array)
    }
    return []
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = {
  find_tweets,
  batch_create_or_update_tweet
}
