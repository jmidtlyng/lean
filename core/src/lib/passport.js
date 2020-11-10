module.exports = (passport, api) =>{
  const LocalStrategy = require('passport-local').Strategy,
        OIDCStrategy = require('passport-azure-ad').OIDCStrategy,
        GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
        graph = require('@microsoft/microsoft-graph-client');

  require('isomorphic-fetch');

  passport.use(new LocalStrategy(
    function (username, password, done){
      api.users.findByLocalCreds(username, password).then((user)=>{ return done(null, user); })
        .catch((e)=>{ return done(null, false, { message: "invalid login"}); })
    }));

  passport.use(new OIDCStrategy({
      identityMetadata: `${process.env.MSAL_AUTHORITY}${process.env.MSAL_ID_METADATA}`,
      clientID: process.env.MSAL_APP_ID,
      responseType: 'code id_token',
      responseMode: 'form_post',
      redirectUrl: process.env.MSAL_REDIRECT_URI,
      allowHttpForRedirectUrl: true,
      clientSecret: process.env.MSAL_APP_PASSWORD,
      validateIssuer: false,
      passReqToCallback: false,
      scope: process.env.MSAL_SCOPES.split(' '),
      loggingLevel: 'info'
    }, msalLoginComplete ));

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI
    }, googleLoginComplete ));

  passport.serializeUser((user, done) => { done(null, user.id) });

  passport.deserializeUser(function(userid, done) {
    api.users.findById(userid).then(user=>{
      if(user){
        done(null, user);
      } else {
        done(null, false, { message: "user no longer valid"});
      }
    }).catch(e=>{ done(e, false, { message: "user no longer valid"}) })
  });

  async function msalLoginComplete(iss, sub, profile, accessToken, refreshToken, params, done) {
    const client = graph.Client.init({
      authProvider: (done) => { done(null, accessToken); }
    });
    try {
      const msUser = await client.api('/me').get();
      const user = await api.users.findByEmail(msUser.userPrincipalName);
      if(user){
        done(null, user);
      } else {
        done(err, null);
      }
    } catch(err) { done(err, null) }
  }

  async function googleLoginComplete(accessToken, refreshToken, profile, done) {
    var emails = profile.emails;
    for(var i = 0; i < emails.length; i++){
      if(emails[i].verified){
        var user = await api.users.findByEmail(emails[i].value);
        return done(null, user);
      }
    }
    return done(null, false, { message: "No matching email addresses"});
  }
}
