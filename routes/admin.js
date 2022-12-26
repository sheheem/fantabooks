const express = require("express");
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/isAdminAuth");
const { body } = require("express-validator");
const { route } = require("./shop");
const router = express.Router();

//Admin Authentication

router.get("/admin-login", adminController.getAdminLogin);

router.post("/admin-login", adminController.postAdminLogin);

router.get("/admin-logout",isAuth, adminController.postAdminLogout);

router.get("/sales-report",isAuth, adminController.getSalesReport);

router.post("/date",isAuth, adminController.postDate);

//Admin Home

router.get("/home",isAuth, adminController.getHome);

router.get("/sales-by-month", adminController.getSalesByMonth);

router.get("/sales-by-week", adminController.getSalesByWeek,)

router.get("/sales-by-year", adminController.getSalesByYear,)

//Admin Product List

router.get("/product-list", isAuth, adminController.getProductList);

router.get("/addproduct",  isAuth, adminController.getAddProducts);

router.post("/addproduct",isAuth, adminController.postAddProducts);

router.get("/edit-product/:productId",isAuth, adminController.getEditProduct);

router.post("/edit-product", isAuth,adminController.postEditProduct);

router.get("/delete-product/:productId",isAuth, adminController.postDeleteProduct);

//Admin User List

router.get("/user-list", isAuth, adminController.getUserManage);

router.get("/edit-user/:id", isAuth, adminController.getEditUser);

router.post("/edit-user/:id",isAuth, adminController.postEditUser);

router.get("/block-user/:id",isAuth, adminController.blockUser);

router.get("/unblock-user/:id",isAuth, adminController.unBlockUser);

//Admin Category List

router.get("/category-list", isAuth, adminController.getCategory);

router.get("/addcategory", isAuth, adminController.getAddCategory);

router.post("/addcategory",isAuth, adminController.postAddCategory);

router.get("/edit-categorylist/:id", isAuth, adminController.getEditCategory);

router.post("/edit-categorylist/:id",isAuth, adminController.postEditCategory);

router.get("/delete-category/:id",isAuth, adminController.getDeleteCategory);

//Admin Order List

router.get("/order-list",isAuth, adminController.getOrderList);

router.get("/order-detail/:id",isAuth, adminController.getOrderDetail)

// router.post('/processing', adminController.postProcessing )

//Admin Coupon List

router.get("/coupon-list",isAuth, adminController.getCouponList);

router.post("/add-coupon",isAuth, adminController.addCoupon);

module.exports = router;
