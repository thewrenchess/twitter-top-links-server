const User = require('../models/user')

const get_user_by_user_id = (user_id) => {
  return User
    .findOne({ 'user_id': user_id })
    .then(user => user)
    .catch(err => {
      throw new Error(err)
    })
}

const create_user = (_user) => {
  const user = new User(_user)

  return user
    .save()
    .then(user => {
      user.access_token = undefined
      user.access_token_secret = undefined
      return user  
    })
    .catch(err => {
      throw new Error(err)
    })
}

const update_user = (user, _user) => {
  return User
    .findOneAndUpdate(
      { user_id: user.user_id },
      { $set: _user },
      { new: true }
    )
    .then(user => {
      user.access_token = undefined
      user.access_token_secret = undefined
      return user  
    })
    .catch(err => {
      throw new Error(err)
    })
}

const create_or_update_user = (_user) => {
  return User
    .findOne({ user_id: _user.user_id })
    .then(user => {
      if (user) {
        return update_user(user, _user)
      }
      return create_user(_user)
    })
    .catch(err => {
      throw new Error(err)
    })
}

module.exports = {
  get_user_by_user_id,
  create_or_update_user
}
