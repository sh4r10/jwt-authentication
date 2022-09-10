const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/user.schema')
const Token = require('../models/token.schema')
const bcrypt = require('bcrypt')
const saltRounds = 1

router.post('/', async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  const match = await bcrypt.compare(req.body.password, user.password)
  if (user && match) {
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30s' }
    )
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET
    )
    bcrypt.hash(refreshToken, saltRounds, async (err, hash) => {
      if (err) return res.json(err)
      const token = new Token({
        user: user._id,
        token: hash,
      })
      try {
        await token.save()
        res.cookie('refreshToken', refreshToken, { httpOnly: true })
        res.json({ accessToken, user })
      } catch (error) {
        res.json(error)
      }
    })
  } else {
    res.json('Login failed')
  }
})

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies['refreshToken']
  if (!refreshToken) return res.sendStatus(401)
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, refreshTokenData) => {
      if (err) return res.sendStatus(403)
      const tokens = await Token.find({ user: refreshTokenData.id })
      const match = tokens.some((t) => bcrypt.compare(refreshToken, t.token))
      if (!match) return res.sendStatus(403)
      const accessToken = jwt.sign(
        { id: refreshTokenData.id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '30s' }
      )
      const newRefreshToken = jwt.sign(
        { id: refreshTokenData.id },
        process.env.REFRESH_TOKEN_SECRET
      )
      bcrypt.hash(newRefreshToken, saltRounds, async (err, hash) => {
        if (err) return res.json(err)
        const token = new Token({
          user: refreshTokenData.id,
          token: hash,
        })
        try {
          const matchedToken = tokens.filter((t) =>
            bcrypt.compare(refreshToken, t.token)
          )
          await Token.findByIdAndDelete(matchedToken[0]._id)
          await token.save()
          res.cookie('refreshToken', newRefreshToken, { httpOnly: true })
          res.json({ accessToken })
        } catch (error) {
          res.json(error)
        }
      })
    }
  )
})

router.delete('/logout', async (req, res) => {
  const refreshToken = req.cookies['refreshToken']
  if (!refreshToken) return res.sendStatus(401)
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, refreshTokenData) => {
      if (err) return res.sendStatus(403)
      const token = await Token.findOne({ user: refreshTokenData.id })
      const match = bcrypt.compare(refreshToken, token.token)
      if (!match) return res.sendStatus(403)
      await Token.deleteOne({ user: refreshTokenData.id })
      res.clearCookie('refreshToken')
      res.json('Logged out')
    }
  )
})

module.exports = router
