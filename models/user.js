const mongoose = require('mongoose')

const user_schema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      trim: true,
      required: true,
      unique: true
    },
    screen_name: {
      type: String,
      trim: true,
      required: true
    },
    access_token: {
      type: String,
      trim: true,
      required: true
    },
    access_token_secret: {
      type: String,
      trim: true,
      required: true
    },
    friends: {
      type: Array,
      default: []
    },
    last_synced: {
      type: Date,
      required: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('User', user_schema)
