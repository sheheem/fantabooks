const crypto = require("crypto");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const user = require("../models/user");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        process.env.API_KEY,
    },
  })
);

exports.getlogin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    res.redirect("/");
  }
  res.render("shop/login.ejs", {
    pageTitle: "Login",
    erroRMessage: req.flash("errorLogin"),
    errorMessage: req.flash("error"),
    oldInput: { email: "", name: "" },
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        erroRMessage = req.flash("errorLogin", "Invalid Email or Pasword");
        return res.redirect("/login");
      }
      if (user.isActive === false) {
        erroRMessage = req.flash(
          "errorLogin",
          "Your Account has been blocked, please contact the administrator"
        );
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              // console.log(err);
              res.redirect("/");
            });
          }
          erroRMessage = req.flash("errorLogin", "Invalid Email or Pasword");
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.isLoggedIn = false;
  req.session.user = false;
  res.redirect("/login");
};

exports.getSignUp = (req, res, next) => {
  if (req.session.isLoggedIn) {
    res.redirect("/");
  }
  res.render("shop/signup.ejs", {
    pageTitle: "Signup",
    errorMessage: null,
    oldInput: "",
  });
};

exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  const phone = req.body.phone;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("shop/signup.ejs", {
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, name: name, phone: phone },
    });
  }
  const userData = {
    email: email,
    name: name,
    password: password,
    phone: phone,
  };
  client.verify.v2
    .services(process.env.SERVICE_SID)
    .verifications.create({ to: `+91${phone}`, channel: "sms" })
    .then((verification) => console.log(verification.status));
  req.session.userData = userData;
  res.render("shop/otp", { pageTitle: "OTP", errorMessage: null });
};

exports.postOtp = (req, res, next) => {
  const otp = req.body.otp;

  client.verify.v2
    .services(process.env.SERVICE_SID)
    .verificationChecks.create({
      to: `+91${req.session.userData.phone}`,
      code: otp,
    })
    .then(async (verification_check) => {
      console.log(verification_check.status);

      if (verification_check.status == "approved") {
        await bcrypt
          .hash(req.session.userData.password, 12)
          .then((hashedPassword) => {
            console.log(hashedPassword);
            const user = new User({
              email: req.session.userData.email,
              name: req.session.userData.name,
              phone: req.session.userData.phone,
              password: hashedPassword,
              isActive: true,
            });

            req.session.isLoggedIn = true;
            req.session.user = user;
            return user
              .save()
              .then((result) => {
                // console.log(result);
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .then((result) => {
            // console.log(result);
            res.redirect("/");
            return transporter.sendMail({
              to: email,
              from: "sheheem@yopmail.com",
              subject: "Signup succeeded!!",
              html: "<h1>You successfully signed up!</h1>",
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res
          .status(422)
          .render("shop/otp", {
            pageTitle: "OTP",
            errorMessage: "Invalid Otp",
          });
      }
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("shop/reset", { pageTitle: "Reset", errorMessage: message });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 300000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        transporter
          .sendMail({
            to: req.body.email,
            from: "sheheem@yopmail.com",
            subject: "Password Reset",
            html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}"> Link </a> to set a new password.</p>`,
          })
          .catch((err) => {
            console.log(err);
          });
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      // console.log(user._id);
      res.render("shop/new-password", {
        pageTitle: "Change Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
    });
};
