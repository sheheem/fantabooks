const isAuth = ((req,res,next) => {
    if(!req.session.isLoggedIn){
        res.redirect('/login-signup')
    }
    next()
})



module.exports = isAuth
