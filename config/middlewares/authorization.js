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
    var mail = req.user.email,
        _id = req.params.dsId || req.query.dsId; //TODO use req.query

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
            },

            function(dataset, cb) {
                if (!dataset)
                    return cb({
                        message: 'Dataset not available'
                    });
                if (dataset.opAcc) {
                    cb(false, true, dataset);
                } else {
                    User.findOne({
                        email: req.user.email,
                        $or: [{
                            'own._id': _id
                        }, {
                            'readable._id': _id
                        }]
                    }, function(err, user) {
                        cb(err, user, dataset);
                    });
                }
            }
        ],
        function(err, results) {
            if (err) {
                req.flash('error', [err.message]);
            } else if (!results[0] && !results[1].opAcc) { //user with no permision & dataset is private
                req.flash('error', ['Access denied']);
            } else {
                req.attach.dataset = results[1]; //attach dataset
            }
            next();
        });
};
