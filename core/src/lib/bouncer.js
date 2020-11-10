module.exports = (app)=>{
  return {
    browserAuth(req, res, next){
     if(req.user){
       app.set('views', path.join(__dirname, '../../../templates'));
       return next();
     } else { return res.redirect('/login'); }},
    browserAdminAuth(req, res, next){
      if(req.user && req.user.isadmin){
        app.set('views', path.join(__dirname, '../templates/admin'));
        return next();
      } else { return res.redirect('/'); }},
    alreadyLoggedIn(req, res, next){
      if(req.user){ return res.status(400).send('Already logged in'); } else { return next(); }
    }
  }
}
