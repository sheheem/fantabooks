const mongoose = require("mongoose");
const Product = require('../models/product')

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  isActive: {
    type: Boolean,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  address: [
    {
      firstname: { type: String },
      lastname: { type: String },
      country: { type: String },
      streetaddress1: { type: String },
      streetaddress2: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: Number },
      phone: { type: Number },
      email: { type: String },
      ordernotes: { type: String },
      def: {
        type: Boolean,
        default: "false",
      },
    },
  ],
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  wishlist: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
  },
  wallet: {
    balance: { type: Number },
    history: [
      {
        amount: {
          type: Number,
          required: true,
        },
      },
      {
        OrderId: { type: Schema.Types.ObjectId, ref: "Order" },
      },
    ],
  },
});

//Wishlist------------------------------------------------------------

userSchema.methods.addtowishList = function (product) {
  const wishlistIndex = this.wishlist.items.findIndex((cp) => {
    console.log(product._id);
    return cp.productId.toString() === product._id.toString();
  });
  let updatedwishlistItems = [...this.wishlist.items];

  if (this.wishlist.items.productId !== product._id) {
    updatedwishlistItems.push({
      productId: product._id,
    });

    const updatedwishList = {
      items: updatedwishlistItems,
    };
    this.wishlist = updatedwishList;
    return this.save();
  } else {
    updatedwishlistItems = this.wishlist.items.filter((item) => {
      return item.productId.toString() !== product._id.toString();
    });
    this.wishlist.items = updatedwishlistItems;
    return this.save();
  }
};

//Remove from wishlist----------------------------------------------------

userSchema.methods.removeFromwishList = function (productId) {
  const updatedwishlistItems = this.wishlist.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.wishlist.items = updatedwishlistItems;
  return this.save();
};

//Add to Cart-------------------------------------------------------------

userSchema.methods.addtoCart =async function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  const stock =  await Product.find({}).select('stock -_id')
  if (cartProductIndex >= 0) {
  // console.log(stock[cartProductIndex]);
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;

   
  } else {
    // if(newQuantity>=stock[cartProductIndex].stock){
    //   newQuantity = stock[cartProductIndex].stock
    //   updatedCartItems.push({
    //     productId: product._id,
    //     quantity: newQuantity,
    //   });
    // } else {
      updatedCartItems.push({
        productId: product._id,
        quantity: newQuantity,
      });
    // }
    // console.log(product);
    
  }
  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

//Qauntity Increment---------------------------------------------

userSchema.methods.quaInc = async function (product) {
  const updatedProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  const updatedCartItems = [...this.cart.items];
  
  
  // console.log(stock[updatedProductIndex].stock);
  // console.log(this.cart.items[updatedProductIndex]);
  

  //  const stock =  await Product.find({}).select('stock -_id')
   

  if(updatedCartItems[updatedProductIndex].quantity >= product.stock ) {
    updatedCartItems[updatedProductIndex].quantity = product.stock
    const updatedCart = {
      items: updatedCartItems,
    };
    this.cart = updatedCart;
    return this.save();
  } else {
    let newQuantity =   updatedCartItems[updatedProductIndex].quantity + 1;
   updatedCartItems[updatedProductIndex].quantity = newQuantity;
    const updatedCart = {
      items: updatedCartItems,
    };
    this.cart = updatedCart;
    return this.save();
  }

  
};

//Quantity Decrement------------------------------------------------------

userSchema.methods.quaDec = function (product) {
  let updatedProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let updatedCartItems = [...this.cart.items];
  let newQuantity = this.cart.items[updatedProductIndex].quantity - 1;

  if (newQuantity >= 1) {
    updatedCartItems[updatedProductIndex].quantity = newQuantity;
    const updatedCart = {
      items: updatedCartItems,
    };
    this.cart = updatedCart;
    return this.save();
  } else {
    updatedCartItems = this.cart.items.filter((item) => {
      return item.productId.toString() !== product._id.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
  }
};

//Remove from Cart--------------------------------------------------------

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
