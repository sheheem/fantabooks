const express = require('express')
const adminRouter = require('./routes/admin')
const shopRouter = require('./routes/shop')
const error = require('./routes/error')
const path = require('path')
const morgan = require('morgan')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const { hasUncaughtExceptionCaptureCallback } = require('process')
const User = require('./models/user')
const authRouter = require('./routes/auth')
const multer = require('multer')
const csurf = require('csurf')
const flash = require('connect-flash')
require('dotenv').config()
const productController = require('./controllers/user')
const adminController = require('./controllers/admin')
const getError = require('./controllers/error')
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)
const cors = require('cors')
// const MONGODB_URI = 'mongodb://localhost:27017'

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:false}))



const fileFilter = (req,file,cb) => {
  if(file.mimetype === 'image/png'|| file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){ 
    cb(null, true)
  }
  else{
    cb(null, false)
  }
}

const fileStorage = multer.diskStorage({
  destination: (req,file,cb) => {
    cb(null, 'images')
  } ,
  filename: (req,file,cb) => {
    cb(null, file.originalname)
  }
})


app.use(multer({storage:fileStorage, fileFilter:fileFilter}).array('image',3))

app.use(morgan('dev'))
// const DB = process.env.DATABASE.replace('<password>',process.env.DATABASE_PASSWORD);


// const store = new MongoDBStore({
//     uri: DB,
//     collection: 'sessions'
// })


app.set('view engine', 'ejs')
app.use((req, res, next)=>{
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next()
  })


app.use(express.static(path.join(__dirname,'public')))
app.use( '/images', express.static(path.join(__dirname,'images')))

// app.use(session({secret: 'my key', resave:false, saveUninitialized: false, store: store}))

app.use((req,res,next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id).then(user => {
    if(!user) {
      return next()
    }
    req.user = user;
    next();
  }).catch(err => {
    console.log(err);
    next(new Error(err))
  })
})


app.post('/admin/received', adminController.postReceived)
app.post('/admin/processing', adminController.postProcessing)
app.post('/admin/shipped', adminController.postShipped)
app.post('/admin/delivered', adminController.postDelivered)


app.use(flash())


// const csurfProtection = csurf()
// app.use(csurfProtection)
// app.use((req, res, next) => {
//   res.locals.isAuthenticated = req.session.isLoggedIn;
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });


app.use('/admin', adminRouter)
app.use(shopRouter)
app.use(authRouter)
// app.use(error)


app.use(getError.useError)
app.use('/500',getError.badError)

app.use((error, req, res, next) => {
    res.status(500).render("500", { pageTitle: "Error 500" });
    console.log(error);
  })




// mongoose.connect(DB, {
//   useNewUrlParser:true,
//   useUnifiedTopology:true
// }).then(() => {
//   console.log('DB connection successful');
// })



//Server Start
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
  console.log(`App running on port ${port}...`);
}) 

 

// const DB = process.env.DATABASE.replace('<password>',process.env.DATABASE_PASSWORD);

// mongoose.connect(DB, {
//     useNewUrlParser:true,
//     useCreateIndex:true,
//     useFindAndModify:false,
//     useUnifiedTopology:true
// }).then(() => {
//     console.log('DB connection successful');
// })