const mongoose = require('mongoose')
const Schema = mongoose.Schema

const wishlist = new Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      wishlist: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
          },
        },
      ],
    },
    { timestamps: true }
  );

  module.exports = mongoose.model('wishlist',wishlist)