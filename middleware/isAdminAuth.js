const isAdminAuth = ((req,res,next) => {
    if(!req.session.adminLogin){
        res.redirect('/admin/admin-login')
    }
    next()
})


module.exports = isAdminAuth