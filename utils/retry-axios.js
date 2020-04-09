const axios = require('axios')

function make_retry_axios (config, max_retries, sleep_ms) {
  const instance = axios.create(config)
  let num_retries = 0

  const sleep_request = (original_request_config) => {
    return new Promise((resolve, reject) => {
      return setTimeout(() => {
        resolve(instance(original_request_config))
      }, sleep_ms)
    })
  }

  instance.interceptors.response.use((response) => {
    return response
  }, (error) => {
    const { config } = error
    const original_request_config = config

    // workaround for axios transform of POST requests
    if ((original_request_config.method === 'POST') && original_request_config.data) {
      original_request_config.data = JSON.parse(original_request_config.data)
    }

    if (num_retries < max_retries) {
      console.log('retrying axios request')
      num_retries += 1
      return sleep_request(original_request_config)
    } else {
      console.log('giving up on axios request', error.response.data)
      return Promise.reject(error)
    }
  })

  return instance
}

module.exports = {
  make_retry_axios
}
