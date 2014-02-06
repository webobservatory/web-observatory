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

exports.hasAccToDB = function(mail, _id, next) {

    async.waterfall([
        function(cb) {
            Entry.findOne({
                '_id': _id,
            }, cb);
        },
        function(dataset, cb) {
            if (!dataset)
                return cb({
                    message: 'Dataset not available'
                });
            var readable = dataset.opAcc;
            if (readable) {
                cb(false, true, dataset);
            } else {
                User.findOne({
                    email: req.user.email,
                    $or: [{
                            'own._id': _id
                        }, {
                            'readable._id': _id
                        }
                    ]
                }, function(err, user) {
                    cb(err, user, dataset);
                });
            }
        },
        function(user, dataset, cb) {
            if (!user)
                return cb({
                    message: "You don't have access to this dataset"
                });
            cb(false, dataset);
        },
    ], next);
};
