const isAuth = ((req,res,next) => {
    if(!req.session.isLoggedIn){
        res.redirect('/login-signup')
    }
})



module.exports = isAuth
