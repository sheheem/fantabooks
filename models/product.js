const mongoose = require('mongoose')
const category = require('./category')

const Schema = mongoose.Schema

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: Array,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required:true
    },
    stock: {
        type: Number,
        required:true
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'Category',
        required:true

    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        
    }

})

const productmodel= mongoose.model('Product', productSchema)
module.exports =productmodel
