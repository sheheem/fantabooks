const { timeStamp } = require('console')
const mongoose = require('mongoose')
const { UserBindingContext } = require('twilio/lib/rest/chat/v2/service/user/userBinding')

const Schema = mongoose.Schema

const orderSchema = new Schema({
    products: [{
        product: {type:Object, required:true},
        quantity: {type: Number, required: true},
        
    }],
    total: {type: Number, required: true},
    user: {
        email: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            required:true,
            ref: 'User'
        }
    },
    orderstatus: {
        type: String,
        required: true,
        default: 'received'

    },

    paymentMethod: {
        type: String,
    },

    deliveryAddress: {
        type: Array,
        ref: 'User',
    },
    coupon: {
        type: Schema.Types.ObjectId,
        ref: "Coupon"
    }

},
{timestamps: true},
)


module.exports = mongoose.model('Order',orderSchema)