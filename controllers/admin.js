const Product = require("../models/product");
const Admin = require("../models/admin");
const User = require("../models/user");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Category = require("../models/category");
const {
  ExportConfigurationContext,
} = require("twilio/lib/rest/bulkexports/v1/exportConfiguration");

//Admin Authentication

exports.getAdminLogin = (req, res, next) => {
  if (req.session.adminLogin) {
    res.redirect("/admin/home");
  }

  res.render("admin/admin-login", { 
    pageTitle: "Admin-Login",
    erroRMessage: req.flash("errorLogin"),
  });
};

exports.postAdminLogin = (req, res, next) => {
  Admin.findOne({
    email: req.body.email,
    password: req.body.password,
  })
    .then((admin) => {
      if (!admin) {
        erroRMessage = req.flash("errorLogin", "Invalid Email or Pasword");
        res.redirect("/admin/admin-login");
      } else {
        req.session.adminLogin = true;
        req.session.admin = admin;
        req.session.save((err) => {
          console.log(err);
          res.redirect("/admin/home");
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postAdminLogout = (req, res, next) => {
  req.session.adminLogin = false;
  res.redirect("/admin/admin-login");
};

//Admin Home

exports.getHome = async (req, res, next) => {
  try {
    if (req.session.adminLogin) {
      const orders = await Order.find();
      const sales = await Order.aggregate([
        { $match: { orderstatus: "delivered" } },
        { $group: { _id: "", total: { $sum: "$total" } } },
        { $project: { _id: 0, total: "$total" } },
      ]);
      // {$project:{_id:0,total:"$total"}},
      //       {$group : {
      //         _id : {
      //       month : {$month : "$entryTime"},
      //       year : {$year :  "$entryTime"}
      //   },
      //       total : {$sum : "$expenseAmount"}
      // }}
      const totalSales = parseFloat(sales[0].total).toFixed(2);
      const returns = await Order.find({
        orderstatus: { $ne: "delivered" },
      });

      const products = await Product.find();
      const users = await User.find();
      res.render("admin/admin-home", {
        pageTitle: "Admin Home",
        orders,
        products,
        users,
        totalSales,
        returns,
      });
    } else {
      res.redirect("/admin/admin-login");
    }
  } catch (err) {
    console.log(err);
  }
};

exports.getSalesByWeek = async(req, res, next) => {
  const week = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun"
  ];
  const salesByWeek = await Order.aggregate([
    {$match: {orderstatus: "delivered"}},
    {$group: {_id: {
      week: {$dayOfWeek: "$createdAt"},
    },
    total: {$sum: "$total"},
    }}
  ])
  // console.log(salesByWeek);
  const data = week.map((el, ind) => {
    const index = salesByWeek.findIndex((el) => el._id.week === ind +1)
    return index === -1 ? 0 : parseFloat(salesByWeek[index].total).toFixed(2)
  })
  res.json({status: "succes",week,data})
}

exports.getSalesByMonth = async (req, res, next) => {
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const salesByMonth = await Order.aggregate([
    { $match: { orderstatus: "delivered" } },
    {
      $group: {
        _id: {
          // day: { $dayOfWeek: "$createdAt" },
          // week: { $week: "$createdAt" },0
          month: { $month: "$createdAt" },
          // year: { $year: "$createdAt" },
        },
        total: { $sum: "$total" },
      },
    },
  ]);

  const data = month.map((el, ind) => {
    const index = salesByMonth.findIndex((el) => el._id.month === ind + 1);
    return index === -1 ? 0 : parseFloat(salesByMonth[index].total).toFixed(2);
  });

  res.json({ status: "success", month, data });
};


exports.getSalesByYear = async (req, res, next) => {
  const year = [
    "2022",
    "2023",
    "2024",
    "2025",
    "2026",
    "2027",
    "2028",
    "2029",
    "2030",
    "2031",
    "2032",
    "2033",    
  ];
  const salesByYear = await Order.aggregate([
    { $match: { orderstatus: "delivered" } },
    {
      $group: {
        _id: {
          // day: { $dayOfWeek: "$createdAt" },
          // week: { $week: "$createdAt" },0
          year: { $year: "$createdAt" },
          // year: { $year: "$createdAt" },
        },
        total: { $sum: "$total" },
      },
    },
  ]);
  // console.log(salesByYear);

  const data = year.map((elem, ind) => {
    const index = salesByYear.findIndex((el) => el._id.year.toString() === elem);
    return index === -1 ? 0 : parseFloat(salesByYear[index].total).toFixed(2);
  });

  res.json({ status: "success", year, data });
};


//Admin User List

exports.getUserManage = (req, res, next) => {
  User.find()
    .then((user) => {
      res.render("admin/user-list", { pageTitle: "User Management", user });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditUser = async (req, res, next) => {
  try {
    let user = req.params.id;
    const response = await User.findById({ _id: user });
    // console.log(response);
    res.render("admin/edit-user", { pageTitle: "Edit User", user: response });
  } catch (err) {
    console.log(err);
  }
};

exports.postEditUser = async (req, res, next) => {
  try {
    let user = req.params.id;

    const updateEmail = req.body.email;
    // user = mongoose.Types.ObjectId(user)
    const response = await User.findByIdAndUpdate(user, { email: updateEmail });
    res.redirect("/admin/user-manage");
  } catch (err) {
    console.log(err);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    let user = req.params.id;
    user = mongoose.Types.ObjectId(user);
    const response = await User.findOneAndUpdate(
      { _id: user },
      { isActive: false }
    );
    // console.log(response);
    res.redirect("/admin/user-list");
  } catch (err) {
    console.log(err);
  }
};

exports.unBlockUser = async (req, res, next) => {
  try {
    let user = req.params.id;
    user = mongoose.Types.ObjectId(user);
    const response = await User.findOneAndUpdate(
      { _id: user },
      { isActive: true }
    );
    // console.log(response);
    res.redirect("/admin/user-list");
  } catch (err) {
    console.log(err);
  }
};

//Admin Category List

exports.getCategory = (req, res, next) => {
  Category.find()
    .then((category) => {
      res.render("admin/category-list.ejs", {
        pageTitle: "Category mangement",
        errorMessage: null,
        validateErrors: [],
        category,
        index: 0,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAddCategory = (req, res, next) => {
  res.render("admin/addcategory", {
    pageTitle: "Add-category",
    errorMessage: null,
    validateErrors: [],
  });
};

exports.postAddCategory = (req, res, next) => {
  const name = req.body.name;
  const image = req.files;
  // console.log(image);

  if (!image) {
    return res.status(422).render("admin/addcategory", {
      pageTitle: "Add-category",
      category: { name: name },
      errorMessage: "Attached file is not an image",
      validateErrors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/addcategory", {
      category: { name: name, image: image },
      errorMessage: errors.array()[0].msg,
      validateErrors: errors.array(),
    });
  }
  const imageUrl = image[0].path;
  // console.log(imageUrl);
  const category = new Category({ image: imageUrl, name: name });
  category
    .save()
    .then((result) => {
      console.log("category created");
      res.redirect("/admin/category-list");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditCategory = async (req, res, next) => {
  try {
    const cateId = req.params.id;
    const category = await Category.findById({ _id: cateId });
    // console.log(category);
    res.render("admin/edit-categorylist.ejs", {
      pageTitle: "Edit category",
      category,
      errorMessage: null,
      validateErrors: [],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postEditCategory = (req, res, next) => {
  const cateId = req.params.id;
  console.log(req.body);
  const updatedName = req.body.name;
  const updatedImage = req.files;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-categorylist", {
      pageTitle: "Edit Category",
      path: "/admin/edit-categorylist",
      category: {
        name: name,
        _id: cateId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  Category.findById(cateId)
    .then((category) => {
      category.name = updatedName;
      if (updatedImage) {
        category.image = updatedImage[0].path;
      }
      return category.save();
    })
    .then((result) => {
      console.log("Category Updated");
      res.redirect("/admin/category-list");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getDeleteCategory = (req, res, next) => {
  const cateId = req.params.id;
  console.log(cateId);
  Category.findByIdAndRemove(cateId)
    .then(() => {
      console.log("Category Deleted");
      res.redirect("/admin/category-list");
    })
    .catch((err) => {
      console.log(err);
    });
};

//Admin Product List

exports.getProductList = (req, res, next) => {
  Product.find().then((products) => {
    res.render("admin/product-list", {
      pageTitle: "Product list",
      product: products,
    });
  });
};

exports.getAddProducts = (req, res, next) => {
  Category.find().then((category) => {
    res.render("admin/addproduct.ejs", {
      pageTitle: "Add-product",
      category,
      errorMessage: null,
      validateErrors: [],
    });
  });
};

exports.postAddProducts = (req, res) => {
  const title = req.body.title;
  const image = req.files;
  const price = req.body.price;
  const description = req.body.description;
  const author = req.body.author;
  const stock = req.body.stock;
  const category = req.body.category;
  console.log(req.body);

  if (!image) {
    return res.status(422).render("admin/addproduct", {
      pageTitle: "Add Product",
      product: {
        title: title,
        price: price,
        description: description,
        author: author,
        stock: stock,
        category: category,
      },
      errorMessage: "Attached file is not an image",
      validateErrors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/addproduct", {
      pageTitle: "Add Product",
      product: {
        title: title,
        price: price,
        imageUrl: imageUrl,
        description: description,
        author: author,
        stock: stock,
        category: category,
      },

      errorMessage: errors.array()[0].msg,
      validateErrors: errors.array(),
    });
  }
  let imageUrl = [];
  for (let i = 0; i < image.length; i++) {
    imageUrl.push(image[i].path);
    // console.log(imageUrl[i]);
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    author: author,
    stock: stock,
    category: category,
  });
  product
    .save()
    .then((result) => {
      console.log("Product Created");
      res.redirect("/admin/product-list");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  Category.find().then((category) => {
    const categories = category;
    const prodId = req.params.productId;
    Product.findById(prodId)
      .populate("category")
      .then((product) => {
        console.log(product);
        if (!product) {
          return res.redirect("/admin/product-list");
        }
        res.render("admin/edit-productlist", {
          pageTitle: "Edit Product",
          product: product,
          category: categories,
          errorMessage: null,
          validationErrors: [],
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.files;
  const updatedDesc = req.body.description;
  const updatedStock = req.body.stock;
  const updatedAuthor = req.body.author;
  const updatedCategory = req.body.category;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
        author: updatedAuthor,
        stock: updatedStock,
        category: updatedCategory,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  let NEWimages = [];
  Product.findById(prodId)
    .populate("category")
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.author = updatedAuthor;
      product.stock = updatedStock;
      product.category = updatedCategory;
      if (image) {
        for (let i = 0; i < image.length; i++) {
          NEWimages.push(image[i].path);
        }
        product.imageUrl = NEWimages;
      }
      return product.save();
    })
    .then((result) => {
      console.log("Product Updated");
      res.redirect("/admin/product-list");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  console.log(prodId);
  Product.findByIdAndRemove(prodId)
    .then(() => {
      console.log("Product Deleted");
      res.redirect("/admin/product-list");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//Admin Order List--------------------------------------------------

exports.getOrderList = (req, res, next) => {
  Order.find()
    .populate("user.userId")
    .sort({ _id: -1 })
    .then((orders) => {
      // console.log(orders);
      res.render("admin/order-list", { pageTitle: "Orders", orders });
    });
};

exports.getOrderDetail = async(req,res,next) => {
  const orderId = req.params.id
  const order = await Order.findById(orderId).populate('user.userId')
  const total = parseFloat(order.total).toFixed(2)
  const calc = order.products[0].product.price*order.products[0].quantity
  const singleTotal = parseFloat(order.products[0].product.price*order.products[0].quantity).toFixed(2)
  // console.log(singleTotal);
  res.render('admin/order-details',{pageTitle: 'Order Detail', order,total,singleTotal})
}

exports.postReceived = async (req, res, next) => {
  orderId = req.body.id;
  await Order.updateOne(
    { _id: orderId },
    { $set: { orderstatus: "received" } }
  );
};

exports.postProcessing = async (req, res, next) => {
  orderId = req.body.id;
  // console.log(orderId);
  await Order.updateOne(
    { _id: orderId },
    { $set: { orderstatus: "processed" } }
  );
};

exports.postShipped = async (req, res, next) => {
  orderId = req.body.id;
  await Order.updateOne({ _id: orderId }, { $set: { orderstatus: "shipped" } });
};

exports.postDelivered = async (req, res, next) => {
  orderId = req.body.id;
  await Order.updateOne(
    { _id: orderId },
    { $set: { orderstatus: "delivered" } }
  );
};

exports.postCancel = async (req, res, next) => {
  orderId = req.body.id;
  await Order.updateOne({ _id: orderId }, { $set: { orderstatus: "cancel" } });
};

//Admin Coupon List----------------------------------------------------

exports.getCouponList = (req, res, next) => {
  Coupon.find().then((coupon) => {
    res.render("admin/coupon-list", { pageTitle: "discount", coupon });
  });
};

exports.addCoupon = async (req, res, next) => {
  const { coupon, type, discPrice, start, end, limit, status } = req.body;
  // console.log(req.body);

  try {
    const exist = await Coupon.findOne({ coupon: req.body.coupon });
    if (exist) {
      res.redirect("/admin/coupon-list");
    } else {
      const coupon = await Coupon.create(req.body);
      res.redirect("/admin/coupon-list");
    }
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};



exports.getSalesReport = async (req, res, next) => {
  try {
    const todayDate = new Date();
    const DaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);

    const saleReport = await Order.aggregate([
      {
        $match: { createdAt: { $gte: DaysAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
          totalPrice: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);
    // salesReport = parseFloat(sales[0].total).toFixed(2)
    // console.log(saleReport);
    res.render("admin/salesreport", { saleReport, pageTitle: "Sales Report" });

    // res.render("admin/salesreport", { saleReport, SalesReport: style });
  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};


exports.postDate = async(req, res, next) => {
  try{
    const fromd = new Date(req.body.fromd)
    const tilld = new Date(req.body.tilld)

    const dateWise = await Order.aggregate([
      {
        $match: { createdAt: { $gte: fromd, $lte: tilld } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
          totalPrice: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({dateWise})

  } catch (err) {
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}