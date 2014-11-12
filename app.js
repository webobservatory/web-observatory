/**
 * Module dependencies.
 */
"use strict";
var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    mongoose = require('mongoose'),
    passport = require("passport"),
    flash = require("connect-flash"),
//express 4.0 middlewares
    morganLogger = require('morgan'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
//favicon = require('static-favicon'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    logging = require('./config/middlewares/logging');

var env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env];

mongoose.connect(config.db);

if (!fs.existsSync(__dirname + '/log')) {
    fs.mkdir(__dirname + '/log');
}

if (!fs.existsSync(__dirname + '/files')) {
    fs.mkdir(__dirname + '/files');
}

var models_dir = __dirname + '/app/models';
fs.readdirSync(models_dir).forEach(function (file) {
    if (file[0] === '.') {
        return;
    }
    require(models_dir + '/' + file);
});
//initialise mongoDB
//var init = require('./init/init');
//    init();

require('./config/passport')(passport, config);

var app = express();
app.disable('x-powered-by');
app.locals.moment = require('moment');
app.set('port', process.env.PORT || 3000);
app.set('httpsPort', process.env.HTTPSPORT || 3443);
app.set('views', __dirname + '/app/views');
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');
//app.use(favicon);
app.use(morganLogger('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'ekd5ia#skd',
    saveUninitialized: true,
    resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));
app.use(methodOverride());
app.use(flash());
app.use(logging);
app.use(express.static(path.join(__dirname, 'public')));

var options = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem')
};

var secureServer = https.createServer(options, app);
var server = http.createServer(app);
var ioSSL = require('socket.io')(secureServer);
var io = require('socket.io')(server);

app.set('socketio', io);

require('./config/routes')(app, passport);

//if ('development' === env) {
//    app.use(errorHandler());
//}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('500', {
        error: err
    });
});

app.use(function (req, res, next) {
    res.status(404);
    if (req.accepts('html')) {
        res.render('404', {
            url: req.url
        });
        return;
    }
    if (req.accepts('json')) {
        res.send({
            error: 'Not found'
        });
        return;
    }
    res.type('txt').send('Not found');
});


secureServer.listen(app.get('httpsPort'), function () {
    console.log('Express ssl server listening on port ' + app.get('httpsPort'));
});

server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

exports.app = app;//for vhost
exports.socketio = io;
exports.socketioSSL = ioSSL;
