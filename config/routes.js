var User = require('../app/models/user');
var Dataset = require('../app/models/dataset');
var Auth = require('./middlewares/authorization.js');
var async = require('async');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var SPARQLGetContent = require('./middlewares/sparql.js').SPARQLGetContent;
var SPARQLUpdate = require('./middlewares/sparql.js').SPARQLUpdateContent;

module.exports = function(app, passport) {


    app.get('/wo/datasets', ensureLoggedIn('/login'), function(req, res) {

        var errmsg = req.flash('error');

        async.waterfall([
            function(cb) {
                User.listEntries(req.user.email, cb);
            },
            function(_visible, _readable, owned, cb) {
                var visible = [];
                var readable = [];
                for (i = 0; i < owned.length; i++) {
                    visible.push(owned[i].url);
                    readable.push(owned[i].url);
                }

                for (i = 0; i < _readable.length; i++) {
                    visible.push(_readable[i].url);
                    readable.push(_readable[i].url);
                }

                for (i = 0; i < _visible.length; i++) {
                    visible.push(_visible[i].url);
                }

                SPARQLGetContent('datasets', visible, readable, cb);
            },
            function(rows, cb) {
                Dataset.transform(rows, cb);
            }
        ], function(err, result) {
            if (err)
                errmsg.push(err.message);
            res.render('datasets', {
                info: req.flash('info'),
                error: errmsg,
                user: req.user,
                table: result,
                scripts: ['/js/jquery.dataTables.js', '/js/underscore-min.js', '/js/datasets.jade.js']
            });
        });
    });

    app.post('/wo/datasets', ensureLoggedIn('/login'), function(req, res) {

        var data = {
            title: req.body.title,
            addType: req.body.type,
            url: req.body.url,
            desc: req.body.desc,
            visible: req.body.visible,
            readable: req.body.readable,
            creator: req.body.creator,
            username: req.user.username,
            email: req.user.email,
        };

        async.waterfall([
            function(cb) {
                SPARQLUpdate('datasets', data, cb);
            },
            function(cb) {
                Dataset.getOrCreateEntry(data, cb);
            },
            function(entry, cb) {
                User.addOwn(req.user.email, entry, cb);
            }
        ], function(err) {
            if (err)
                req.flash('error', [err.message]);
            else
                req.flash('info', ['Dataset added successfully']);
            res.redirect('/wo/datasets');
        });
    });

    app.post('/dataset/access', ensureLoggedIn('/login'), function(req, res) {
        var sender_mail = req.user.email,
            oid = req.body.id;
        Dataset.findById(oid, function(err, entry) {
            if (err)
                req.flash('error', [err.message]);
            else if (!entry)
                req.flash('error', ['No entry found']);
            else {
                User.addReq(sender_mail, entry.creator, entry.url, 'readable', function(err, info) {
                    if (err)
                        req.flash('error', [err]);
                    if (info)
                        req.flash('info', [info]);
                });
            }
            res.redirect('/wo/dataset');
        });
    });

    app.get('/wo/queries', ensureLoggedIn('/login'), function(req, res) {
        res.render('queries', {
            user: req.user,
            scripts: ['/js/query.jade.js']
        });
    });

    app.get('/wo/visualisations', ensureLoggedIn('/login'), function(req, res) {
        var email = req.user.email;
        var errmsg = req.flash('error');

        async.waterfall([
            function(cb) {
                User.listEntries(email, cb);
            },
            function(_visible, _readable, owned, cb) {

                var visible = [];
                var readable = [];
                for (i = 0; i < owned.length; i++) {
                    visible.push(owned[i].url);
                }

                for (i = 0; i < _readable.length; i++) {
                    visible.push(_readable[i].url);
                }

                for (i = 0; i < _visible.length; i++) {
                    visible.push(_visible[i].url);
                }

                SPARQLGetContent('visualisations', visible, readable, cb);
            }
        ], function(err, result) {
            if (err)
                errmsg.push(err.message);
            res.render('visualisations', {
                info: req.flash('info'),
                error: errmsg,
                user: req.user,
                table: result,
                scripts: ['/js/jquery.dataTables.js', '/js/underscore-min.js', '/js/vis.js']
            });
        });
    });

    app.post('/wo/visualisations', ensureLoggedIn('/login'), function(req, res) {
        var data = {
            title: req.body.title,
            source: req.body.source,
            url: req.body.url,
            desc: req.body.desc,
            visible: req.body.visible,
            creator: req.body.creator,
            username: req.user.username,
            email: req.user.email,
            addType: 'Visualisation'
        };

        async.waterfall([
            function(cb) {
                SPARQLUpdate('visualisations', data, cb);
            },
            function(cb) {
                Dataset.getOrCreateEntry(data, cb);
            },
            function(entry, cb) {
                User.addOwn(req.user.email, entry, cb);
            }
        ], function(err) {
            if (err)
                req.flash('error', [err.message]);
            else
                req.flash('info', ['Visualisation added succeffully']);
            res.redirect('/wo/visualisations');
        });
    });

    app.get("/", function(req, res) {
        if (req.isAuthenticated()) {
            res.render("index", {
                user: req.user
            });
        } else {
            res.render("index", null);
        }
    });

    app.get("/login", function(req, res) {
        res.render("login", {
            info: req.flash('info'),
            error: req.flash('error')
        });
    });

    app.post("/login", passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: "/login",
        failureFlash: true
    }));

    app.get("/signup", function(req, res) {
        res.render("signup");
    });

    app.post("/signup", Auth.userExist, function(req, res, next) {
        User.signup(req.body.email, req.body.password, function(err, user) {
            if (err) throw err;
            req.login(user, function(err) {
                if (err) return next(err);
                return res.redirect("profile");
            });
        });
    });

    app.get("/auth/facebook", passport.authenticate("facebook", {
        scope: "email"
    }));

    app.get("/auth/facebook/callback",
        passport.authenticate("facebook", {
        successReturnToOrRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }), function(req, res) {
        res.render("profile", {
            user: req.user
        });
    });

    app.get('/auth/soton', function(req, res) {
        res.render('soton');
    });

    app.post('/auth/soton', passport.authenticate('ldapauth', {
        failureRedirect: '/login',
        failureFlash: true,
        successReturnToOrRedirect: '/'
    }));


    app.get("/profile", Auth.isAuthenticated, function(req, res) {
        User.findOne({
            email: req.user.email
        }, function(err, user) {
            var parameter = {
                user: req.user
            };
            var errmsg = req.flash('error');
            if (err) {
                errmsg.push(err.message);
            } else {
                parameter.msg = user.msg;
                parameter.owned = user.owned;
                parameter.requested = user.requested;
            }

            parameter.error = errmsg;
            parameter.info = req.flash('info');

            res.render('profile', parameter);
        });
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};
