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
        if (count === 0) {
            next();
        } else {
            req.flash('info', ['User already exists, please login']);
            res.redirect("/login");
        }
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
            if (!req.attach) {
                req.attach = {};
            }

            if (err) {
                req.flash('error', [err.message]);
            } else if (!results[1]) {
                req.flash('error', ['No entry found']);
            } else if (!results[0] && !results[1].opAcc) { //user with no permission & dataset is private
                req.flash('error', ['Access denied']);
            } else {
                req.attach = req.attach || {};
                req.attach.dataset = results[1]; //attach dataset
            }
            next();
        });
};

exports.isOwner = function (req, res, next) {
    if (!req.user) {
        return res.send(401, 'Unauthorised');
    }

    var eid = req.params.eid || req.query.eid || req.body.eid;

    User.findOne({
        email: req.user.email,
        $or: [
            {
                own: eid
            },
            {
                clients: eid
            }
        ]
    }, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.send(401, 'Unauthorised');
        }
        next();
    });
};

exports.rememberMe = function (req, res, next) {
    // Issue a remember me cookie if the option was checked
    if (!req.body.remember_me) {
        return next();
    }

    crypto.randomBytes(32, function (ex, buf) {
        var token = buf.toString('hex');
        req.user.rememberme = token;
        req.user.save(function (err, user) {
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
