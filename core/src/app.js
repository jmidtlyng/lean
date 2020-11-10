require('dotenv').config();
const express = require('express'),
      passport = require('passport');
      path = require('path'),
      cookieParser = require('cookie-parser'),
      logger = require('morgan'),
      session = require('express-session'),
      cors = require('cors');

const app = express();
const http = require('http').createServer(app);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../../templates'));

app.use(logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));
app.use(express.json());
app.use(session({ secret: process.env.SECRET, resave: false, saveUninitialized: false }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/css', express.static(path.join(__dirname, '../../public/assets/css')));
app.use('/js', express.static(path.join(__dirname, '../../public/assets/js')));
app.use('/icons', express.static(path.join(__dirname, '../../public/assets/img/icon')));
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());

require('./routes/connect')(app, passport, path);

http.listen(process.env.PORT || 3000, () => {
  console.log(`listening on ${process.env.PORT}`);
});
