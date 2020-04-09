const Tweet = require('../models/tweet')

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
      { tweet_id: user.tweet_id },
      { $set: _tweet },
      { new: true }
    )
    .then(tweet => tweet)
    .catch(err => {
      throw new Error(err)
    })
}

const create_or_update_tweet = (_tweet) => {
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

const sleep = () => {
  const sleep_ms = 1000

  return new Promise((resolve) => {
    return setTimeout(() => {
      resolve({})
    }, sleep_ms)
  })
}

const batch_create_or_update_tweet = async (tweet_array) => {
  for (let i = 0; i < tweet_array.length; i++) {
    if (((i + 1) % 100) === 0) {
      await sleep()
    }

    const tweet = tweet_array[i]
    await create_or_update_tweet(tweet)
  }
}

module.exports = {
  batch_create_or_update_tweet
}
