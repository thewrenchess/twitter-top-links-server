const mongoose = require('mongoose')

const tweet_schema = new mongoose.Schema(
  {
    tweet_id: {
      type: String,
      trim: true,
      required: true,
      unique: true
    },
    user_id: {
      type: String,
      trim: true,
      required: true
    },
    screen_name: {
      type: String,
      trim: true,
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    urls: {
      type: Array,
      default: []
    },
    hashtags: {
      type: Array,
      default: []
    },
    tweet_created_at: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Tweet', tweet_schema)
