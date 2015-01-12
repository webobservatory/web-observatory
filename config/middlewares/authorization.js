'use strict';
var User = require('../../app/models/user'),
    Entry = require('../../app/models/entry'),
    crypto = require('crypto'),
    async = require('async');

exports.isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('info', ['Please login first']);
        res.redirect("/login");
    }
};

exports.userExist = function (req, res, next) {
    User.count({
        email: req.body.email
    }, function (err, count) {
        if (err) {
            return next(err);
        }

        if (count === 0) {
            return next();
        }

        req.flash('info', ['User already exists, please login']);
        res.redirect("/login");
    });
};

exports.hasAccToDB = function (req, res, next) {
    var user = req.user || {own: [], readable: []}, //in case user is null
        _id = req.param('eid');

    async.parallel([
            function (cb) {

                var own = user.own,
                    readable = user.readable;
                if (readable.indexOf(_id) !== -1 || own.indexOf(_id) !== -1) {
                    cb(null, true);
                }
                else {
                    cb(null, false);
                }
            },

            function (cb) {
                Entry.findById(_id, cb);
            }
        ],
        function (err, results) {
            if (err) {
                return next(err);
            }

            if (!req.attach) {
                req.attach = {};
            }

            var ds = results[1];

            if (!ds) {
                return next({message: 'No entry found'});
            }

            if (!results[0] && !ds.opAcc) { //user with no permission & dataset is private
                return next({message: 'Access denied'});
            }

            req.attach = req.attach || {};
            req.attach.dataset = ds; //attach dataset
            next();
        });
};

exports.isOwner = function (req, res, next) {
    var user = req.user,
        eid = req.param('eid');

    if (!user) {
        return res.status(401).send('Unauthorised');
    }

    if (user.own.indexOf(eid) !== -1 || user.clients.indexOf(eid) !== -1) {
        return next();
    }

    return res.status(401).send('Unauthorised');
};

exports.rememberMe = function (req, res, next) {
    // Issue a remember me cookie if the option was checked
    if (!req.body.remember_me) {
        return next();
    }

    crypto.randomBytes(32, function (ex, buf) {
        var token = buf.toString('hex');
        req.user.rememberme = token;
        req.user.save(function (err) {
            if (err) {
                return next(err);
            }
            res.cookie('remember_me', token, {
                path: '/',
                httpOnly: true,
                maxAge: 604800000
            });
            return next();
        });
    });
};
