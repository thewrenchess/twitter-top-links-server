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

const find_all_tweet_id = () => {
  return Tweet
    .find({})
    .select('tweet_id')
    .then(tweets => {
      if (tweets.length) {
        return tweets.map(tweet => tweet.tweet_id)
      }
      return null
    })
    .catch(err => {
      throw new Error(err)
    })
}

const create_tweets = (tweets) => {
  return find_all_tweet_id()
    .then(tweet_ids => {
      let new_tweets = [...tweets]
      if (tweet_ids) {
        new_tweets = new_tweets.filter(tweet => tweet_ids.includes(tweet.tweet_id))
      }
      if (!new_tweets.length) {
        return new Promise(resolve => resolve())
      }
      return Tweet
        .collection
        .insertMany(new_tweets, { ordered: false})
        .then(() => [])
        .catch(err => {
          throw new Error(err)
        })
    })
}

module.exports = {
  find_tweets,
  create_tweets
}
