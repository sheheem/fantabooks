const { array } = require('i/lib/util')
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const categorySchema = new Schema ({
    image: {
        type: Array,
        required: true
    },
    name: {
    type: String,
    required: true
    }
})

module.exports = mongoose.model('Category',categorySchema)