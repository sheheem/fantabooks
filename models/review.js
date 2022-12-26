const mongoose = require('mongoose')

const Schema = mongoose.Schema

const reviewSchema = new Schema({
    rating: {
        type: Number,
      
    },
    review: {
        type: String,
      
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    },  
    {timestamps: true}
)

module.exports = mongoose.model('Review',reviewSchema)