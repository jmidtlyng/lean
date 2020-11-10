module.exports = (app, bouncer) => {
  app.get('/login', (req, res) => {
    app.set('views', path.join(__dirname, '../../../templates'));
    if(req.user) {
      res.redirect('/');
    } else { res.render('login'); }
  });

  app.get('/logout', bouncer.browserAuth, (req, res) => {
    req.session.destroy(function(err) {
      req.logout();
      res.redirect('/');
    });
  });
}
