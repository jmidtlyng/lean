module.exports = (app, passport) => {
  const express = require('express'),
        pgp = require('pg-promise')({ query(e) { console.log(e.query); } }),
        sse = require('./sse.js')(app);

  const db = pgp({
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB,
          schema: process.env.DB_SCHEMA,
          password: process.env.DB_PW,
          port: process.env.DB_PORT });


  const api = require('../lib/api.js')(db, sse),
        bouncer = require('../lib/bouncer.js')(app);

  require('../lib/passport.js')(passport, api);
  require('./doorway.js')(app, bouncer, sse);

  const router = require('./index.js')(express, api),
        midtlware = require('../lib/midtlware.js')(express, api),
        authRouter = require('./auth.js')(passport, express);

  const basicMidtlware = midtlware.basic(),
        adminMidtlware = midtlware.admin();

  app.use('/auth', bouncer.alreadyLoggedIn, authRouter);
  app.use('/admin', bouncer.browserAdminAuth, adminMidtlware, router);
  app.use('/', bouncer.browserAuth, basicMidtlware, router);
}
