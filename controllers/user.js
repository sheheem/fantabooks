const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const moment = require("moment");
const wishlist = require("../models/wishlist");
const Coupon = require("../models/coupon");
const Review = require("../models/review");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const ITEMS_PER_PAGE = 8;

exports.getHomePage = async (req, res, next) => {
  // console.log(req.get("Cookie"));
  await Product.find().then((product) => {
    // console.log(req.session.user);
    res.locals.product = product;
    res.render("shop/home.ejs", {
      pageTitle: "Home",
      user: req.session?.user?.name,
      isAuthenticated: req.session.isLoggedIn,
    });
  });
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await User.findById({ _id: userId });

    res.render("shop/profile", {
      pageTitle: "profile",
      profile,
      user: req.session?.user?.name,
      isAuthenticated: req.session.isLoggedIn,
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const users = await User.findById(userId);
    const walletHistory = users.wallet;
    res.render("shop/recent-activity.ejs", {
      pageTitle: "Recent Activity",
      walletHistory,
      users,
      user: req.session?.user?.name,
      isAuthenticated: req.session.isLoggedIn,
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product.ejs", {
        pageTitle: "product",
        prods: products,
        user: req.session?.user?.name,
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        totalProducts: totalItems,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = async (req, res, next) => {
  try {
    const prodId = req.params.id;
    const product = await Product.findById(prodId).populate("category");
    const review = await Review.find({ product: prodId }).populate("user");
    res.render("shop/single-product", {
      product: product,
      pageTitle: product?.title,
      user: req.session?.user?.name,
      review,
      isAuthenticated: req.session.isLoggedIn,
    });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postReview = async (req, res, next) => {
  try {
    const prodId = req.params.id;
    const rating = req.body.rating;
    const description = req.body.description;
    const review = await Review.create({
      rating: rating,
      review: description,
      product: prodId,
      user: req.user.id,
    });
    res.redirect("/product/" + prodId);
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Cart Rendering------------------------------------------------

exports.getCart = (req, res, next) => {
  console.log('At cart1');
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      let total = 0;

      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });
      console.log('At cart2');

      res.render("shop/cart", {
        pageTitle: "Your Cart",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
        user: req.session?.user?.name,
        totalSum: total,
        errorMessage: req.flash("error"),
      });
    })
    .catch((err) => {
  console.log('At cart3');

      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//Increasing Quantity of cart items---------------------------------------

exports.getInc = (req, res, next) => {
  const prodId = req.query.id;
  Product.findById(prodId)
    .then((product) => {
      return req.user.quaInc(product);
    })
    .then((result) => {
      res.status(200).json({ message: "Success!" });
    });
};

//Decreasing Qunatity of Cart Items----------------------------------------

exports.getDec = (req, res, next) => {
  const prodId = req.query.id;
  Product.findById(prodId)
    .then((product) => {
      return req.user.quaDec(product);
    })
    .then((result) => {
      res.status(200).json({ message: "Success!" });
    });
};

//Action of Updated Cart----------------------------------------

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      // const update = await Product.updateOne({_id:product._id},{$inc:{stock:-1}})

      return req.user.addtoCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    });
};

//Deleting Cart items--------------------------------------

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

// exports.postwishList =async (req,res,next) => {
//     productId = req.body.productId
//     userId = req.user._id

//     const userFind =  await wishlist.findOne({user: userId})
//     if(!userFind){
//         const newwishList = new wishlist(
//             {
//                 user:userId,
//                 wishlist: [{ product: productId }],
//             }
//         )
//         newwishList.save()
//         res.redirect('/wishlist')

//     }
//     else{
//         const wishlistOld = await wishlist.findOne({user:userId,   "wishlist.product": productId})
//         if(!wishlistOld) {
//             let productArray = { product: productId };
//             await wishlist.findOneAndUpdate( { user: userId },
//                 { $push: { wishlist: productArray } })
//                 res.redirect('/wishlist')
//         }else{
//             res.redirect('/wishlist')
//         }
//     }

// }

//Wishlist Rendering---------------------------------------------------

exports.getwishList = (req, res, next) => {
  req.user.populate("wishlist.items.productId").then((user) => {
    const products = user.wishlist.items;
    // console.log(products);
    res.render("shop/wishlist", {
      pageTitle: "Your Wishlist",
      prods: products,
      user: req.session?.user?.name,
      isAuthenticated: req.session.isLoggedIn,
    });
  });
};

//Updated Wishlisted Page-------------------------------------------------

exports.postwishList = (req, res, next) => {
  // for(let i=0; i < req.user.wishlist.items.length; i++){
  //     console.log(req.user.wishlist.items[i].productId,'hiiiiiiiiiii');
  // }

  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      // for (let i=0; i < req.user.wishlist.items.length; i++) {
      // exist = req.user.wishlist.items[i].productId;
      // }
      // if (exist == product) {
      //     return req.user.removeFromwishList(product)
      // } else {
      return req.user.addtowishList(product);
      // }
      //existing id can be checked using req.user.wishlist.items.productId
    })
    .then((result) => {
      res.redirect("/wishlist");
    });
};

//Checkout Rendering Page---------------------------------------------

exports.getCheckOut = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((users) => {
      const products = users.cart.items;
      let total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      res.render("shop/checkout", {
        pageTitle: "checkout",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
        user: req.session?.user?.name,
        totalSum: total,
        users,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//Coupon Action-------------------------------------------------

exports.postCoupon = async (req, res, next) => {
  let total = 0;

  try {
    const coupon = await Coupon.findOne({ coupon: req.body.coupon });
    // console.log(coupon);
    if (coupon) {
      if (new Date(coupon.end).getTime() - Date.now() < 0)
        return res.json({ message: "coupon Expired!!!" });
      if (coupon.user.includes(req.user.id))
        return res.json({ message: "Already Redeemed" });
      req.user.populate("cart.items.productId").then((users) => {
        // console.log(users);
        const products = users.cart.items;
        products.forEach((p) => {
          if (coupon.type === "Percentage") {
            total += p.quantity * p.productId.price;
            discPrice = (total * coupon.discPrice) / 100;
            newTotal = total - discPrice;
          } else if (coupon.type === "Fixed Amount") {
            total += p.quantity * p.productId.price;
            discPrice = coupon.discPrice;
            newTotal = total - discPrice;
          }
        });
        req.session.coupon = coupon;
        req.session.discPrice = newTotal;
        // console.log(newTotal);
        // res.render('shop/checkout', {pageTitle: 'checkout', products: products, isAuthenticated: req.session.isLoggedIn, user: req.session?.user?.name, totalSum:newTotal, users})
        return res.json({
          newTotal,
          message: "success",
        });
      });
    }
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// exports.postAddress = async (req,res,next) => {
//     const userId = req.user.id
//     const address = req.user.address
//    const seleAdd = await Order.updateOne({"user.userId":userId},{$set:{"deliveryAddress":address}})
//    console.log(seleAdd);
// }

exports.getBilling = async (req, res, next) => {
  try {
    const users = req.user;
    const userId = req.user.id;
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items;
    let total = 0;
    products.forEach((p) => {
      total += p.quantity * p.productId.price;
    });

    res.render("shop/billing", {
      pageTitle: "billing",
      isAuthenticated: req.session.isLoggedIn,
      user: req.session?.user?.name,
      totalSum: total,
      users,
      products,
    });
    // user = await User.findOne({_id:req.user.id,"address.def":true})
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postBilling = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      country,
      streetaddress1,
      streetaddress2,
      city,
      state,
      zip,
      phone,
      email,
      ordernotes,
    } = req.body;
    if (firstname == "") {
      res.redirect("/checkout");
    } else {
      const userId = req.user.id;

      const newAddress = await User.updateOne(
        { _id: userId },
        { $push: { address: req.body } }
      );
      res.redirect("/checkout");
    }
  } catch (err) {
    console.log(err);
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

//Order Rendering Page-------------------------------------------

exports.getOrder = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .sort({ _id: -1 })
    .then((orders) => {
      // console.log(orders);
      res.render("shop/orders", {
        pageTitle: "Orders",
        orders: orders,
        moment,
        user: req.session?.user?.name,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// CASH ON DELIVERY-------------------------------------------------------------------------------

exports.postOrderCod = (req, res, next) => {
  //Order
  let totalSum = 0;
  // const token = req.body.stripeToken
  req.user
    .populate("cart.items.productId")
    .then(async (user) => {
      if (req.session.coupon) {
        totalSum = req.session.discPrice;
        const couponApplied = await Coupon.findByIdAndUpdate(
          req.session.coupon._id,
          { $push: { user: req.user.id } },
          { new: true }
        );
        console.log(couponApplied);
      } else {
        user.cart.items.forEach((p) => {
          totalSum += p.quantity * p.productId.price;
        });
      }
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });

      const quantities = products[0].quantity;

      await Product.updateOne(
        { _id: products[0].product._id },
        { $inc: { stock: -quantities } }
      );

      if (req.session.coupon) {
        const order = new Order({
          user: {
            email: req.user.email,
            userId: req.user,
          },
          products: products,
          total: totalSum,
          paymentMethod: "cod",
          deliveryAddress: req.user.address,
          coupon: req.session.coupon._id,
        });
        return order.save();
      } else {
        const order = new Order({
          user: {
            email: req.user.email,
            userId: req.user,
          },
          products: products,
          total: totalSum,
          paymentMethod: "cod",
          deliveryAddress: req.user.address,
        });
        return order.save();
      }
    })
    .then((result) => {
      return req.user.clearCart();
      req.session.coupon = null;
    })
    .then(() => {
      res.json({ Response: true });
    })
    .catch((err) => {
      console.log(err);
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//ONLINE ORDER------------------------------------------------------------

exports.postOrderOnline = (req, res, next) => {
  let totalSum = 0;
  const token = req.body.stripeToken;
  req.user
    .populate("cart.items.productId")
    .then(async (user) => {
      user.cart.items.forEach((p) => {
        totalSum += p.quantity * p.productId.price;
      });
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const quantities = products[0].quantity;

      await Product.updateOne(
        { _id: products[0].product._id },
        { $inc: { stock: -quantities } }
      );

      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
        total: totalSum,
        paymentMethod: "online",
        deliveryAddress: req.user.address,
      });
      return order.save();
    })
    .then((result) => {
      const charge = stripe.charges.create({
        amount: totalSum * 100,
        currency: "usd",
        description: "Demo Order",
        source: token,
        metadata: { order_id: result._id.toString() },
      });

      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/order");
    })
    .catch((err) => {
      console.log(err);
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//CANCELLING-------------------------------------------------------------

exports.postCancel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.body.id;

    const check = await Order.findById({ _id: orderId });
    // console.log(check);
    if (check.paymentMethod === "online") {
      const wallet = await User.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: { "wallet.balance": check.total },
          $push: { "wallet.history": { amount: check.total } },
        }
      );
      await Order.updateOne(
        { _id: orderId },
        { $set: { orderstatus: "cancel" } }
      );
      const quantity = check.products[0].quantity;

      await Product.updateOne(
        { _id: check.products[0].product._id },
        { $inc: { stock: quantity } }
      );
    } else {
      await Order.updateOne(
        { _id: orderId },
        { $set: { orderstatus: "cancel" } }
      );
      const quantity = check.products[0].quantity;

      await Product.updateOne(
        { _id: check.products[0].product._id },
        { $inc: { stock: quantity } }
      );
    }
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
