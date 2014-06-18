/**
 * Module dependencies.
 */

var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    passport = require("passport"),
    flash = require("connect-flash"),
    //express 4.0 middlewares
    morganLogger = require('morgan'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    favicon = require('static-favicon'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    logging = require('./app/controllers/middleware/logging');

var env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env];

mongoose.connect(config.db);

var models_dir = __dirname + '/app/models';
fs.readdirSync(models_dir).forEach(function(file) {
    if (file[0] === '.') return;
    require(models_dir + '/' + file);
});
//initialise mongoDB
//var init = require('./init/init');
//    init();

require('./config/passport')(passport, config);

var app = express();

app.locals.moment = require('moment');
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/app/views');
app.engine('jade', require('jade').__express);
app.set('view engine', 'jade');
//app.use(favicon);
app.use(morganLogger('dev'));
app.use(cookieParser());
app.use(bodyParser());
app.use(session({
    secret: 'keyboard cat'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));
app.use(methodOverride());
app.use(flash());
app.use(logging);
app.use(express.static(path.join(__dirname, 'public')));

require('./config/routes')(app, passport);

var env = process.env.NODE_ENV || 'development';
if ('development' === env) app.use(errorHandler());

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('500', {
        error: err
    });
});

app.use(function(req, res, next) {
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


app.listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});

exports.app = app; //for vhost
