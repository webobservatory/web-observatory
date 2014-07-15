var User = require('../../app/models/user'),
    Entry = require('../../app/models/entry'),
    async = require('async');

exports.isAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('info', ['Please login first']);
        res.redirect("/login");
    }
};

exports.userExist = function(req, res, next) {
    User.count({
        email: req.body.email
    }, function(err, count) {
        if (count === 0) {
            next();
        } else {
            req.flash('info', ['User already exists, please login']);
            res.redirect("/login");
        }
    });
};

exports.hasAccToDB = function(req, res, next) {
    var user = req.user, //user should not be null
        mail = user.email,
        _id = req.params.dsId || req.query.dsId;

    async.parallel([

            function(cb) {
                var own = user.own,
                    readable = user.readable;
                if (readable.indexOf(_id) !== -1 || own.indexOf(_id) !== -1)
                    cb(null, true);
                else
                    cb(null, false);
            },

            function(cb) {
                Entry.findById(_id, cb);
            }
        ],
        function(err, results) {
            if (!req.attach) req.attach = {};

            if (err) {
                req.flash('error', [err.message]);
            } else if (!results[1]) {
                req.flash('error', ['No entry found']);
            } else if (!results[0] && !results[1].opAcc) { //user with no permision & dataset is private
                req.flash('error', ['Access denied']);
            } else {
                req.attach.dataset = results[1]; //attach dataset
            }
            next();
        });
};

exports.isOwner = function(req, res, next) {
    if (!req.user) return res.send(401, 'Unauthorised');

    var eid = req.params.eid || req.query.eid || req.body.eid;

    User.findOne({
        email: req.user.email,
        $or: [{
            own: eid
        }, {
            clients: eid
        }]
    }, function(err, user) {
        if (err) return next(err);
        if (!user) return res.send(401, 'Unauthorised');
        next();
    });
};
