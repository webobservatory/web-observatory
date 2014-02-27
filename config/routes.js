var User = require('../app/models/user');
var Entry = require('../app/models/entry');
var Auth = require('./middlewares/authorization.js');
var async = require('async');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var queries = require('./middlewares/queries.js');
var Recaptcha = require('recaptcha').Recaptcha;
var pbk = '6LfwcOoSAAAAACeZnHuWzlnOCbLW7AONYM2X9K-H';
var prk = '6LfwcOoSAAAAAGFI7h_SJoCBwUkvpDRf7_r8ZA_D';
var pass = require('../app/util/pass');
var logger = require('../app/util/logger');
var modctrl = require('../app/controllers/modctrl');

module.exports = function(app, passport) {

    app.get("/", function(req, res) {
        if (req.isAuthenticated()) {
            res.render("index", {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user
            });
        }
        else {
            res.render("index", {
                info: req.flash('info'),
                error: req.flash('error')
            });
        }
    });

    //listing entries
    app.get('/catlg/:typ(dataset|visualisation)', function(req, res) {
        var email = req.user ? req.user.email : null;
        modctrl.visibleEtry(email, req.params.typ, function(err, entries) {
            if (err) {
                req.flash('error', [err.message]);
            }
            res.render('catlg', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                table: entries,
                type: req.params.typ
            });
        });
    });

    app.get('/stats', function(req, res) {
        var sequence = {};

        Entry.find({}, function(err, entries) {
            for (var i = 0; i < entries.length; i++) {
                var etry = entries[i];
                var type = etry.type;
                var additional = etry.querytype;
                var key = type;
                if (type === 'dataset') key = key + '-' + additional;
                if (!sequence[key]) {
                    sequence[key] = 1;
                }
                else {
                    sequence[key] = sequence[key] + 1;
                }
            }
            res.render('stats', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                seq: sequence
            });
        });
    });

    app.get('/add/:typ(dataset|visualisation)', ensureLoggedIn('/login'), function(req, res) {
        res.render('addetry', {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user,
            type: req.params.typ
        });
    });

    //dataset names autocompletion
    app.get('/nametags/:typ(dataset|visualisation)', function(req, res) {
        var term = req.query.term;
        Entry.find({
            type: req.params.typ,
            name: {
                $regex: term,
                $options: 'i'
            }
        }, 'name', function(err, etries) {
            var names = etries.map(function(etry) {
                return etry.name;
            });
            res.json(names);
        });
    });

    //adding an entry
    app.post('/add/:typ(dataset|visualisation)', ensureLoggedIn('/login'), function(req, res) {
        var email = req.user.email;
        var etry = {
            url: req.body.url,
            auth: {
                user: req.body.user,
                encpwd: req.body.pwd,
                apikey: req.body.apikey
            },
            name: req.body.name,
            type: req.params.typ,
            querytype: req.body.querytype,
            desc: req.body.desc,
            publisher: email,
            git: req.body.git,
            lice: req.body.lice,
            kw: req.body.kw ? req.body.kw.split(',') : [],
            des: req.body.des,
            opAcc: req.body.acc !== 'false',
            opVis: req.body.vis !== 'false'
        };

        modctrl.addEtry(email, etry, function(err) {
            if (err) {
                req.flash('error', [err.message]);
                res.redirect('/add/' + req.params.typ);
            }
            else {
                req.flash('info', ['New entry added']);
                res.redirect('/catlg/' + req.params.typ);
            }
        });
    });

    app.get('/edit/:eid', ensureLoggedIn('/login'), function(req, res) {

        var eid = req.params.eid;

        Entry.findOne({
            _id: eid,
            publisher: req.user.email
        }, function(err, entry) {
            if (err || !entry) {
                logger.error(err || {
                    message: 'Entry not found under the current user'
                });
                req.flash('error', ["Entry not found under the current user"]);
                return res.redirect('profile'); //TODO ajax rather than refreshing
            }

            res.render('editetry', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                data: entry
            });
        });
    });

    app.post('/edit/:eid', ensureLoggedIn('/login'), function(req, res) {
        var etry_id = req.params.eid;
        var etry = {};

        //Auth
        User.findOne({
            email: req.user.email,
            own: etry_id
        }, function(err, user) {

            if (err || !user) {
                logger.error(err || {
                    message: 'Entry not found under the current user'
                });
                req.flash('error', [err ? err.message : 'Entry not found under the current user']);
                return res.redirect(req.get('referer'));
            }
            if (req.body.url) etry.url = req.body.url;
            if (req.body.name) etry.name = req.body.name;
            if (req.body.des) etry.des = req.body.des;
            if (req.body.lice) etry.lice = req.body.lice;
            if (req.body.related) etry.related = req.body.related;
            if (req.body.kw) etry.kw = req.body.kw.split(',');
            if (req.body.vis) etry.vis = req.body.vis === 'true';
            if (req.body.acc) etry.acc = req.body.acc === 'true';

            modctrl.editEtry(etry_id, etry, function(err) {
                if (err) {
                    req.flash('error', [err.message]);
                    res.redirect(req.get('referer'));
                }
                else {
                    req.flash('info', ['Entry edited']);
                    res.redirect('profile');
                }
            });
        });
    });

    //remove entries
    app.get('/remove/:eid', ensureLoggedIn('/login'), function(req, res) {
        var umail = req.user.email;
        var ids = req.params.eid.split(',');

        if (!ids) {
            req.flash('error', ['No entry selected']);
            return res.redirect(req.get('referer'));
        }

        if (typeof ids === 'string') ids = [ids];

        User.findOne({
            email: umail
        }, function(err, user) {
            if (err || !user) {
                err = err || {
                    message: 'User not logged in'
                };
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }

            async.map(ids, function(eid, cb) {
                Entry.findByIdAndRemove(eid, cb);
                user.own.pull(eid);
            }, function(err) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                }
                user.save(function(err) {
                    if (err) req.flash('error', [err.message]);
                    else req.flash('info', ['Entry deleted successfully']);
                    return res.redirect(req.get('referer'));
                });
            });
        });
    });

    //request access of datasets
    app.get('/reqacc/:eid', ensureLoggedIn('/login'), function(req, res) {
        var issuer = req.user.email,
            etryIds = [req.params.eid];

        modctrl.reqAccToEtry(etryIds, issuer, function(err) {
            if (err) {
                req.flash('error', [err.message]);
            }
            else {
                req.flash('info', ['Request sent']);
            }
            res.redirect(req.get('referer'));
        });
    });

    app.post('/reqacc', ensureLoggedIn('/login'), function(req, res) {
        var issuer = req.user.email,
            etryIds = req.body.ids;
        if (!etryIds) {
            req.flash('info', ['No entry selected']);
            res.redirect(req.get('referer'));
        }
        if (typeof etryIds === 'string') etryIds = [etryIds];

        modctrl.reqAccToEtry(etryIds, issuer, function(err) {
            if (err) {
                req.flash('error', [err.message]);
            }
            else {
                req.flash('info', ['Request sent']);
            }
            res.redirect(req.get('referer'));
        });
    });

    //approve access to datasets
    app.post('/aprvacc', ensureLoggedIn('/login'), function(req, res) {
        var deny = req.body.deny === 'true',
            owner = req.user.email,
            reqids = req.body.reqids;
        if (typeof reqids === 'string') reqids = [reqids];

        modctrl.aprvAccToEtry(deny, reqids, owner, function(err) {

            if (err) {
                req.flash('error', [err.message]);
            }
            else {
                req.flash('info', [deny ? 'Request denied' : 'Request approved']);
            }
            res.redirect(req.get('referer'));
        });
    });

    //mongodb schema names autocompletion
    app.get('/schematags', ensureLoggedIn('/login'), function(req, res) {
        Entry.findById(req.query.dsId, function(err, ds) {
            queries.mongodbschema(ds, function(err, names) {
                res.json(names);
            });
        });
    });
    //execute user queries
    app.get('/query/:format/:dsId', ensureLoggedIn('/login'), function(req, res) {
        var qtype = '';
        switch (req.params.format.toLowerCase()) {
        case 'mysql':
            qtype = 'sql';
            break;
        case 'postgressql':
            qtype = 'sql';
            break;
        default:
            qtype = req.params.format.toLowerCase();
        }

        async.waterfall([function(cb) {
            if (qtype === 'mongodb') {
                Entry.findById(req.params.dsId, function(err, ds) {
                    queries.mongodbschema(ds, function(err, names) {
                        cb(null, names);
                    });
                });
            }
            else cb(null, null);
        }], function(err, result) {
            res.render('query/' + qtype, {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                dsID: req.params.dsId,
                tags: result
            });
        });
    });

    app.get('/endpoint/:dsId/:typ', ensureLoggedIn('/login'), function(req, res) {
        var query = req.query.query,
            mime = req.query.format,
            modname = req.query.modname, //for mongodb
            _id = req.params.dsId,
            qtyp = req.params.typ;

        if (modname) {
            query = {
                modname: modname,
                query: query
            };
        }

        var qlog = {};
        qlog.time = new Date();
        qlog.ip = req.connection.remoteAddress;
        qlog.query = query;
        qlog.usrmail = req.user.email;

        async.waterfall([

        function(cb) {
            Auth.hasAccToDB(req.user.email, _id, cb);
        },

        function(ds, cb) {
            qlog.ds = ds.url;
            var queryDriver = queries.drivers[ds.querytype.toLowerCase()];
            if (!queryDriver) cb({
                message: 'Query type not supported'
            });
            else queryDriver(query, mime === 'display' ? 'text/csv' : mime, ds, cb);
        }], function(err, result) {
            qlog.result = result;
            logger.info(qlog);
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }

            if (mime === 'display') {
                var viewer = 'csvview';
                if (qtyp === 'mongodb') viewer = 'jsonview';
                res.render('query/' + viewer, {
                    'result': result,
                    'info': req.flash('info'),
                    'error': req.flash('error')
                });
            }
            else {
                res.attachment('result.txt');
                res.end(result, 'UTF-8');
            }
        });
    });

    app.get('/contest', ensureLoggedIn('/login'), function(req, res) {
        var test = queries.tests[req.query.typ];
        if (!test) return res.json({
            message: 'Dataset type not yet supported'
        });
        test({
            url: req.query.url,
            user: req.query.user,
            pwd: req.query.pwd
        }, function(msg) {
            res.json(msg);
        });
    });
    //authentication

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
        var recaptcha = new Recaptcha(pbk, prk);
        res.render('signup', {
            layout: false,
            recaptcha_form: recaptcha.toHTML()
        });
    });

    app.post("/signup", Auth.userExist, function(req, res, next) {
        var data = {
            remoteip: req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response: req.body.recaptcha_response_field
        };

        var recaptcha = new Recaptcha(pbk, prk, data);
        recaptcha.verify(function(success, error_code) {
            if (success) {
                User.signup(req.body.fn, req.body.ln, req.body.org, req.body.email, req.body.password, function(err, user) {
                    if (err) throw err;
                    req.login(user, function(err) {
                        if (err) return next(err);
                        return res.redirect("/profile");
                    });
                });
            }
            else {
                req.flash('error', ['Recaptcha not valid.']);
                res.render('signup', {
                    locals: {
                        recaptcha_form: recaptcha.toHTML()
                    }
                });
            }
        });
    });

    app.get("/auth/facebook", passport.authenticate("facebook", {
        scope: "email"
    }));

    app.get('/auth/soton', function(req, res) {
        res.render('soton', {
            'info': req.flash('info'),
            'error': req.flash('error')
        });
    });

    app.post('/auth/soton', passport.authenticate('ldapauth', {
        failureRedirect: '/auth/soton',
        failureFlash: true,
        successReturnToOrRedirect: '/'
    }));
    //profile
    app.get("/profile", ensureLoggedIn('/login'), function(req, res) {
        User.findOne({
            email: req.user.email
        }).populate('own').populate('accreq').populate('pendingreq.entry').exec(function(err, user) {
            var parameter = {
                'user': user
            };
            var errmsg = req.flash('error');
            if (err) {
                errmsg.push(err.message);
            }
            else {
                parameter.msg = user.msg;
                parameter.owned = user.own;
                parameter.requested = user.accreq;
                parameter.pending = user.pendingreq;
            }

            parameter.error = errmsg;
            parameter.info = req.flash('info');
            res.render('profile', parameter);
        });
    });

    //update user profile
    app.post("/profile", ensureLoggedIn('/login'), function(req, res) {
        var oldpw = req.body.oldpw,
            newpw = req.body.newpw,
            fn = req.body.fn,
            ln = req.body.ln,
            org = req.body.org,
            email = req.user.email;
        if (newpw) {
            User.isValidUserPassword(email, oldpw, function(err, user, msg) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                }

                if (!user) {
                    req.flash('error', [msg.message]);
                    return res.redirect(req.get('referer'));
                }

                User.updateProfile(user, newpw, fn, ln, org, function(err, user) {
                    if (err) {
                        req.flash('error', [err.message]);
                        return res.redirect(req.get('referer'));
                    }
                    else {
                        req.flash('info', ['Profile updated']);
                        return res.redirect(req.get('referer'));
                    }
                });
            });
        }
        else {
            User.findOne({
                'email': email
            }, function(err, user) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                }

                User.updateProfile(user, null, fn, ln, org, function(err, user) {
                    if (err) {
                        req.flash('error', [err.message]);
                        return res.redirect(req.get('referer'));
                    }
                    else {
                        req.flash('info', ['Profile updated']);
                        return res.redirect(req.get('referer'));
                    }
                });

            });
        }
    });

    //remove messages
    app.post('/profile/message', ensureLoggedIn('/login'), function(req, res) {
        var msgid = req.body.msgid;
        if (typeof msgid === 'string') msgid = [msgid];

        User.findOne({
            email: req.user.email
        }, function(err, user) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            for (var mid in msgid) {
                user.msg.remove(msgid[mid]);
            }

            user.save(function(err) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                }
                req.flash('info', ['Messages cleared']);
                res.redirect(req.get('referer'));
            });
        });
    });

    //reseting password
    app.get('/profile/reset-pass', function(req, res) {
        var tk = req.query.tk;
        if (!tk) {
            req.flash('error', ['Password reset token is missing, please request again.']);
            return res.redirect('/login');
        }

        res.render('reset-pass', {
            'tk': tk
        });
    });

    app.post('/profile/reset-pass', function(req, res) {
        var tk = req.body.tk,
            confpass = req.body.confirm,
            newpass = req.body.password;

        if (newpass !== confpass) {
            req.flash('error', ['Passwords do not match']);
            return res.redirect(req.get('referer'));
        }

        pass.resetPass(tk, newpass, function(err, user) {
            if (err || !user) {
                req.flash('error', [err.message || 'User not found']);
                return res.redirect('/login');
            }
            req.login(user, function(err) {
                if (err) {
                    req.flash('error', [err.message]);
                    req.flash('error', ['An error occured, please login manually.']);
                    return res.redirect('/login');
                }
                res.redirect('/');
            });
        });
    });

    app.get('/profile/forgot-pass', function(req, res) {
        res.render('forgot-pass', {
            'info': req.flash('info'),
            'error': req.flash('error')
        });
    });

    app.post('/profile/forgot-pass', function(req, res) {
        pass.forgotPass(req.body.email, 'http://' + req.host + ':' + app.get('port') + '/profile/reset-pass', function(err, response) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect('/profile/forgot-pass');
            }
            req.flash('info', ['Please check your email to reset your password.']);
            res.redirect('/login');
        });
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

};
