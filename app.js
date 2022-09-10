const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const port = 3000
require('dotenv').config()

const usersController = require('./controllers/users')
const authController = require('./controllers/auth')

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Could not connect to MongoDB', err))

app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.json('Hello World')
})

app.use('/api/users', usersController)
app.use('/api/auth', authController)

app.listen(port)
