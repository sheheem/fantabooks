const express = require("express");
const authController = require("../controllers/auth");
const { check, body } = require("express-validator");
const User = require("../models/user");
const router = express.Router();

router.get("/signup", authController.getSignUp);

router.get("/login", authController.getlogin);

router.post("/login", authController.postLogin);

router.get("/logout", authController.postLogout);

router.post(
  "/signup",
  check("email")
    .isEmail()
    .withMessage("Please Enter a Valid Email")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject("Email Already Exists");
        }
      });
    }),
  body(
    "password",
    "Please enter a password with atleast 4 characters"
  ).isLength({ min: 4 }),
  body("confirmpass").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password Does not match");
    }
    return true;
  }),
  body("phone", "Please enter a valid phone number ")
    .isMobilePhone("en-IN")
    .custom((value, { req }) => {
      return User.findOne({ phone: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject("Phone already exists");
        }
      });
    }),
  authController.postSignUp
);

router.post("/otp", authController.postOtp);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
