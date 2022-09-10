const mongoose = require('mongoose')
const { Schema } = mongoose

const tokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    token: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

const Token = mongoose.model('Token', tokenSchema)
module.exports = Token
