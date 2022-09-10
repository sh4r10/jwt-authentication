const router = require('express').Router()
const User = require('../models/user.schema')
const verifyToken = require('../middleware/authentication')
const bcrypt = require('bcrypt')
const saltRounds = 10

router.get('/', verifyToken, (req, res) => {
  res.json('Welcome to users route, ' + req.user.name + '!')
})

router.post('/', async (req, res) => {
  const { name, email } = req.body
  bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
    const user = new User({
      name,
      email,
      password: hash,
    })
    try {
      const savedUser = await user.save()
      res.json(savedUser)
    } catch (error) {
      res.json(error)
    }
  })
})

module.exports = router
