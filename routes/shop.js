const express = require("express");
const productController = require("../controllers/user");
const router = express.Router();

router.get("/", productController.getHomePage);

router.get("/profile", productController.getProfile);

router.get("/recent-activity", productController.getRecentActivity);

router.get("/products", productController.getProducts);

router.get("/product/:id", productController.getProduct);

router.post("/product/:id", productController.postReview);

router.get("/cart", productController.getCart);

router.post("/cart", productController.postCart);

router.get("/quantityInc", productController.getInc);

router.get("/quantityDec", productController.getDec);

router.get("/wishlist", productController.getwishList);

router.post("/wishlist", productController.postwishList);

router.get("/order", productController.getOrder);

router.post("/cancel", productController.postCancel);

// router.post("/order",productController.postOrder) already defined in app.js file

router.get("/checkout", productController.getCheckOut);

router.get("/billing", productController.getBilling);

router.post("/billing", productController.postBilling);

router.post("/orderonline", productController.postOrderOnline);

router.post("/ordercod", productController.postOrderCod);

// router.post('/cod',productController.postCod)

// router.post('/online',productController.postOnline)
// router.post('/coupon',productController.postCoupon)

router.post("/coupon", productController.postCoupon);

module.exports = router;
