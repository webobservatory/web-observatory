var User = require('../app/models/user');
var Auth = require('./middlewares/authorization.js');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var SPARQLGetContent = require('./middlewares/sparql.js').SPARQLGetContent;
var SPARQLUpdate = require('./middlewares/sparql.js').SPARQLUpdateContent;

module.exports = function(app, passport) {


    app.get('/wo/datasets', ensureLoggedIn('/login'), function(req, res) {

        var email = req.user.email;

        User.listDatasets(email, function(err, user) {

            if (user) {
                SPARQLGetContent('datasets', user, function(rows) {

                    res.render('datasets', {
                        user: req.user,
                        table: rows,
                        scripts: ['/js/jquery.dataTables.js', '/js/underscore-min.js', '/js/datasets.js']
                    });
                });

            } else {
                req.flash('error', 'No matching user');
            }
        });
    });

    app.post('/wo/datasets', ensureLoggedIn('/login'), function(req, res) {

        var data = {
            title: req.body.title,
            type: req.body.type,
            url: req.body.url,
            desc: req.body.desc,
            visible: req.body.visible,
            readable: req.body.readable,
            creator: req.body.creator,
            username: req.user.username,
            email: req.user.email,
            addType: 'SPARQL'
        };

        SPARQLUpdate('datasets', data, function(msg) {
            req.flash('info', msg);
            res.redirect('/wo/datasets');
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

        User.listDatasets(email, function(err, user) {

            if (user) {
                SPARQLGetContent('visualisations', user, function(rows) {
                    res.render('visualisations', {
                        user: req.user,
                        table: rows,
                        scripts: ['/js/jquery.dataTables.js', '/js/underscore-min.js', '/js/vis.js']
                    });
                });
            } else {
                req.flash('error', 'No matching user');
            }
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

        SPARQLUpdate('visualisations', data, function(msg) {
            req.flash('info', msg);
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
        res.render("login");
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
        res.render("profile", {
            user: req.user
        });
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};
