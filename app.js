const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const body_parser = require('body-parser')
const cookie_parser = require('cookie-parser')
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 800

const MONGO_PASSWORD = process.env.MONGO_PASSWORD
if (!MONGO_PASSWORD) {
  throw new Error('missing MONGO_PASSWORD')
}
const MONGO_URI = `mongodb+srv://admin:${MONGO_PASSWORD}@twitter-top-link-xqpi4.mongodb.net/test?retryWrites=true&w=majority`

const api_routes = require('./routes')

const app = express()

// middleware
app.use(morgan('dev'))
app.use(body_parser.json())
app.use(cookie_parser())
app.use(cors())

// routes
app.use('/api', api_routes)

app.use((err, req, res, next) => {
  console.log(err)
  res.status(500).send({ error: err })
})

mongoose.connection.on('error', err => {
  console.log(`DB connection error ${err.message}`)
})

mongoose.connect(
  MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  }
)
  .then(() => {
    console.log('DB Connected')
    app.listen(PORT, () => {
      console.log(`Listening on localhost:${PORT}`)
    })
  })
