const express = require("express");
const productController = require("../controllers/user");
const isAuth = require("../middleware/isAuth");
const router = express.Router();

router.get("/", productController.getHomePage);

router.get("/profile", productController.getProfile);

router.get("/recent-activity",isAuth, productController.getRecentActivity);

router.get("/products", productController.getProducts);

router.get("/product/:id", productController.getProduct);

router.post("/product/:id",isAuth, productController.postReview);

router.get("/cart",isAuth, productController.getCart);

router.post("/cart",isAuth, productController.postCart);

router.get("/quantityInc",isAuth, productController.getInc);

router.get("/quantityDec",isAuth, productController.getDec);

router.get("/wishlist",isAuth, productController.getwishList);

router.post("/wishlist",isAuth, productController.postwishList);

router.get("/order",isAuth, productController.getOrder);

router.post("/cancel",isAuth, productController.postCancel);

// router.post("/order",productController.postOrder) already defined in app.js file

router.get("/checkout",isAuth, productController.getCheckOut);

router.get("/billing",isAuth, productController.getBilling);

router.post("/billing",isAuth, productController.postBilling);

router.post("/orderonline",isAuth, productController.postOrderOnline);

router.post("/ordercod", isAuth,productController.postOrderCod);

// router.post('/cod',productController.postCod)

// router.post('/online',productController.postOnline)
// router.post('/coupon',productController.postCoupon)

router.post("/coupon",isAuth, productController.postCoupon);

module.exports = router;
