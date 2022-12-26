const moment = require('moment/moment')
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const couponSchema = new Schema ({

    coupon: {
        type: String,
        required: true
    },

    type: {
        type: String,
        required: true,
    },

    start: {
        type: String,
        default: moment().format("DD/MM/YYYY") + ";" + moment().format("hh:mm:ss"),
        required: true
    },

    end: {
        type: String,
        required: true
    },

    discPrice: {
        type: Number,
        required: true
    },
    
    status : {
        type: String,
        required: true
    },

    limit : {
        type: Number,
        required: true
    },
    user: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ]

})

module.exports = mongoose.model('Coupon' ,couponSchema)