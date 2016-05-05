/**
 * Module dependencies.
 */
"use strict";
var express = require('express'),
    app,
    accessLogStream,
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    mongoose = require('mongoose'),
    passport = require("passport"),
    flash = require("connect-flash"),
//express 4.0 middlewares
    morganLogger = require('morgan'),
    winstonLogger = require('./app/util/logger'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    servestatic = require('serve-static'),
    favicon = require('serve-favicon'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env],
    models_dir = __dirname + '/app/models';

global.approot = path.resolve(__dirname);

mongoose.connect(config.db);

if (!fs.existsSync(__dirname + '/log')) {
    fs.mkdir(__dirname + '/log');
}

if (!fs.existsSync(__dirname + '/files')) {
    fs.mkdir(__dirname + '/files');
}


fs.readdirSync(models_dir).forEach(function (file) {
    if (file[0] === '.') {
        return;
    }
    require(models_dir + '/' + file);
});

require('./config/passport')(passport, config);

app = express();
app.disable('x-powered-by');
app.locals.moment = require('moment');
app.set('port', process.env.PORT || config.port.http || config.listenOn.http);
app.set('httpsPort', process.env.HTTPSPORT || config.port.https || config.listenOn.https);
app.set('views', __dirname + '/app/views');
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/favicon.ico'));

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
//app.use(/^\/(?!(js|fonts|css|images|img))/, passport.authenticate('jwt', {session: true}));

//logging
function skip(req, res) {
    var ignorPath = ['css', 'js', 'fonts', 'images', 'img'];
    if (-1 !== ignorPath.indexOf(req.path.split('/')[1]) && res.statusCode < 400) //ignore SUCCESSFUL requests to certain paths
    {
        return true;
    }
}

morganLogger.token('email', function (req) {
    var user = req.user || {};
    return user.email;
});

app.use(morganLogger('tiny', {
    skip: skip
}));

accessLogStream = fs.createWriteStream(__dirname + '/log/morgan.log', {
    flags: 'a'
});
app.use(morganLogger(':remote-addr - :remote-user :email [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', { //Apache combined extended with user email
    stream: accessLogStream,
    skip: skip
}));

app.use(methodOverride());
app.use(flash());
app.use('/git', servestatic(path.join(__dirname, 'git')));
app.use('/vis', servestatic(path.join(__dirname, 'vis')));
app.use(servestatic(path.join(__dirname, 'public')));

var options = {
    key: fs.readFileSync(path.join(__dirname, './ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './ssl/cert.pem'))
};

var secureServer = https.createServer(options, app);
var server = http.createServer(app);
var ioSSL = require('socket.io')(secureServer);
var io = require('socket.io')(server);
app.set('socketio', io);
app.set('socketioSSL', ioSSL);

require('./config/routes')(app, passport);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function (err, req, res, __) {
    winstonLogger.error(err.message);
    if (req.xhr) {
        res.status(500).send(err);
    } else {
        res.status(err.status || 500);
        res.render('500', {
            error: err
        });
    }
});

secureServer.listen(config.listenOn.https, function () {
    console.log('Express ssl server listening on port ' + app.get('httpsPort'));
});

server.listen(config.listenOn.http, function () {
    console.log('Express server listening on port ' + app.get('port'));
});

module.exports.app = app; //for vhost
module.exports.socketio = io;
module.exports.socketioSSL = ioSSL;
