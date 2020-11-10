module.exports = (passport, express) => {
  var router = express.Router();

  router.post('/login',
    passport.authenticate("local",{ failureRedirect: '/login'}),
    (req, res) => { res.redirect('/'); });

  router.get('/msal',
      (req, res, next) => {
      passport.authenticate('azuread-openidconnect',
        { response: res,
          prompt: 'login',
          failureRedirect: '/',
          failureFlash: false,
          successRedirect: '/'
        } )(req,res,next);
    }
  );

  router.post('/msal-callback',
    (req, res, next) => {
      passport.authenticate('azuread-openidconnect',
        { response: res,
          failureRedirect: '/',
          failureFlash: false,
          successRedirect: '/'
        } )(req,res,next);
    }
  );

  router.get('/google', passport.authenticate('google', { scope: ['profile','email' ] }));

  router.get('/google-callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => { res.redirect('/'); });

  return router;
}
