var User = require('../app/models/user'),
    Entry = require('../app/models/entry'),
    Client = require('../app/models/client'),
    Auth = require('./middlewares/authorization.js'),
    async = require('async'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
    queries = require('./middlewares/queries.js'),
    config = require('./config').development,
    Recaptcha = require('recaptcha').Recaptcha,
    pbk = config.recap_pbk, //'6LfwcOoSAAAAACeZnHuWzlnOCbLW7AONYM2X9K-H'
    prk = config.recap_prk, //'6LfwcOoSAAAAAGFI7h_SJoCBwUkvpDRf7_r8ZA_D'
    pass = require('../app/util/pass'),
    logger = require('../app/util/logger'),
    crypto = require('crypto'),
    modctrl = require('./middlewares/modctrl'),
    cors = require('cors'),
    oauth2 = require('../oauth/oauth2server');

module.exports = function (app, passport) {

    app.options('*', cors()); //for pre-flight cors

    app.get("/", function (req, res) {
        if (req.isAuthenticated()) {
            res.render("index", {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user
            });
        } else {
            res.render("index", {
                info: req.flash('info'),
                error: req.flash('error')
            });
        }
    });

    //listing entries
    app.get('/wo/:typ(dataset|visualisation)', function (req, res) {
        var email = req.user ? req.user.email : null;
        modctrl.visibleEtry(email, req.params.typ, function (err, entries) {
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

    //catalogue right panel
    app.get('/wo/:eid', function (req, res) {
        var email = req.user ? req.user.email : null,
            eid = req.params.eid;
        Entry.findById(eid, function (err, entry) {

            if (err || !entry) return res.send(err.message || 'No record found');

            if (!entry.opVis && email !== entry.publisher) return res.send('Record not visible to public');

            if (email && email === entry.publisher) entry.isOwner = true;

            if (req.user && req.user.readable && req.user.readable.indexOf(eid) !== -1) entry.isOwner = true;

            res.render('catlog-detail', {
                etry: entry
            });
        });
    });

    //display vis
    app.get('/wo/show/:eid', function (req, res, next) {
        Entry.findById(req.params.eid, function (err, entry) {
            if (err) return next(err);
            if (!entry) {
                req.flash('error', ['No entry found']);
                return res.redirect(req.get('referer'));
            }

            res.render('vis-panel', {
                user: req.user,
                entry: entry
            });
        });
    });

    app.get('/stats', function (req, res) {
        var sequence = {};

        Entry.find({}, function (err, entries) {
            for (var i = 0; i < entries.length; i++) {
                var etry = entries[i];
                var type = etry.type;
                var additional = etry.querytype;
                var key = type;
                if (type === 'dataset') key = key + '-' + additional;
                if (!sequence[key]) {
                    sequence[key] = 1;
                } else {
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

    app.get('/add/:typ(dataset|visualisation)', ensureLoggedIn('/login'), function (req, res) {
        res.render('addetry', {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user,
            type: req.params.typ
        });
    });

    //searching
    app.get('/search', function (req, res) {
        var term = req.query.keyword;

        if (!term) return res.render('search', {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user
        });

        Entry.find({
            type: 'dataset',
            name: {
                $regex: term,
                $options: 'i'
            }
        }, function (err, entries) {
            if (err) req.flash('error', [err.message]);
            if (!entries || 0 === entries.length) req.flash('error', 'No records found');
            res.render('search', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                entries: entries
            });
        });
    });

    //dataset names autocompletion
    app.get('/nametags/:typ(dataset|visualisation)', function (req, res) {
        var term = req.query.term;
        Entry.find({
            type: req.params.typ,
            name: {
                $regex: term,
                $options: 'i'
            }
        }, 'name', function (err, etries) {
            var names = etries.map(function (etry) {
                return etry.name;
            });
            res.json(names);
        });
    });

    //adding an entry
    app.post('/add/:typ(dataset|visualisation)', ensureLoggedIn('/login'), function (req, res) {
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
            publisher_name: req.user.username || ((req.user.firstName ? req.user.firstName + ' ' : '') + (req.user.lastName || '')),
            related: req.body.basedOn,
            git: req.body.git,
            lice: req.body.lice,
            kw: req.body.kw ? req.body.kw.split(',') : [],
            des: req.body.des,
            opAcc: req.body.acc !== 'false',
            opVis: req.body.vis !== 'false'
        };

        modctrl.addEtry(email, etry, function (err) {
            if (err) {
                req.flash('error', [err.message]);
                res.redirect('/add/' + req.params.typ);
            } else {
                req.flash('info', ['New entry added']);
                res.redirect('/wo/' + req.params.typ);
            }
        });
    });

    app.get('/detail/:eid', ensureLoggedIn('/login'), function (req, res) {
        Entry.findOne({
            _id: req.params.eid,
            publisher: req.user.email
        }, function (err, entry) {
            if (err || !entry) {
                logger.error(err || {
                    message: 'Entry not found under the current user'
                });
                req.flash('error', ["Entry not found under the current user"]);
                return res.redirect(req.get('referer'));
            }

            res.render('detail', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                etry: entry
            });
        });
    });

    app.post('/detail/:eid', Auth.isOwner, function (req, res) {
        var eid = req.params.eid;
        var etry = {};

        switch (req.body.name) {
            case 'url':
                etry.url = req.body.value;
                break;
            case 'name':
                etry.name = req.body.value;
                break;
            case 'des':
                etry.des = req.body.value;
                break;
            case 'lice':
                etry.lice = req.body.value;
                break;
            case 'creator':
                etry.creator = req.body.value;
                break;
            case 'git':
                etry.git = req.body.value;
                break;
            case 'related':
                etry.related = req.body.value;
                break;
            case 'kw':
                etry.kw = req.body.value.split(',');
                break;
            case 'acc':
                etry.opAcc = req.body.value.indexOf('private') === -1;
                etry.opVis = req.body.value.indexOf('novis') === -1;
                break;
        }
        modctrl.editEtry(eid, etry, function (err) {
            if (err) {
                res.send(400, err.message);
            } else {
                res.send(200);
            }
        });
    });

    app.get('/edit/:eid', ensureLoggedIn('/login'), function (req, res) {

        var eid = req.params.eid;

        Entry.findOne({
            _id: eid,
            publisher: req.user.email
        }, function (err, entry) {
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

    app.post('/edit/:eid', Auth.isOwner, function (req, res) {
        var eid = req.params.eid;
        var etry = {};

        if (req.body.url) etry.url = req.body.url;
        if (req.body.name) etry.name = req.body.name;
        if (req.body.des) etry.des = req.body.des;
        if (req.body.lice) etry.lice = req.body.lice;
        if (req.body.creator) etry.creator = req.body.creator;
        if (req.body.git) etry.git = req.body.git;
        if (req.body.related) etry.related = req.body.related;
        if (req.body.kw) etry.kw = req.body.kw.split(',');
        etry.opVis = !req.body.vis;
        etry.opAcc = !req.body.acc;

        modctrl.editEtry(eid, etry, function (err) {
            if (err) {
                req.flash('error', [err.message]);
                res.redirect(req.get('referer'));
            } else {
                req.flash('info', ['Entry edited']);
                res.redirect('/profile');
            }
        });
    });

    //remove entries
    app.get('/remove/:eid', ensureLoggedIn('/login'), function (req, res) {
        var ids = req.params.eid.split(','),
            user = req.user;

        if (!ids) {
            req.flash('error', ['No entry selected']);
            return res.redirect(req.get('referer'));
        }

        if ('string' === typeof ids) ids = [ids];

        async.map(ids, function (eid, cb) {
            if (-1 !== user.own.indexOf(eid)) {
                Entry.findByIdAndRemove(eid, cb);
                user.own.pull(eid);
            }
        }, function (err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            user.save(function (err) {
                if (err) req.flash('error', [err.message]);
                else req.flash('info', ['Entry deleted successfully']);
                return res.redirect(req.get('referer'));
            });
        });
    });

    //request access of datasets
    app.get('/reqacc/:eid', ensureLoggedIn('/login'), function (req, res) {
        var issuer = req.user.email,
            etryIds = [req.params.eid];

        modctrl.reqAccToEtry(etryIds, issuer, function (err) {
            if (err) {
                req.flash('error', [err.message]);
            } else {
                req.flash('info', ['Request sent']);
            }

            res.render('includes/flash-banner', {
                info: req.flash('info'),
                error: req.flash('error')
            });
        });
    });

    app.post('/reqacc', ensureLoggedIn('/login'), function (req, res) {
        var user = req.user,
            eids = req.body.ids;
        if (!eids) {
            req.flash('info', ['No entry selected']);
            res.redirect(req.get('referer'));
        }
        if (typeof eids === 'string') eids = [eids];

        modctrl.reqAccToEtry(eids, user, function (err) {
            if (err) {
                req.flash('error', [err.message]);
            } else {
                req.flash('info', ['Request sent']);
            }
            res.redirect(req.get('referer'));
        });
    });

    //approve access to datasets
    app.post('/aprvacc', ensureLoggedIn('/login'), function (req, res) {
        var deny = req.body.deny === 'true',
            user = req.user,
            reqids = req.body.reqids;
        if ('string' === typeof reqids) reqids = [reqids];

        modctrl.aprvAccToEtry(deny, reqids, user, function (err) {

            if (err) {
                req.flash('error', [err.message]);
            } else {
                req.flash('info', [deny ? 'Request denied' : 'Request approved']);
            }
            res.redirect(req.get('referer'));
        });
    });

    //mongodb schema names autocompletion
    //TODO deprecated route?
    app.get('/schematags', ensureLoggedIn('/login'), function (req, res) {
        Entry.findById(req.query.dsId, function (err, ds) {
            queries.mongodbschema(ds, function (err, names) {
                res.json(names);
            });
        });
    });

    //execute user queries
    app.get('/query/:format/:eid', function (req, res) {
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

        async.waterfall([

            function (cb) {
                if (qtype === 'mongodb') {
                    Entry.findById(req.params.eid, function (err, ds) {
                        queries.mongodbschema(ds, cb);
                    });
                } else cb(null, null);
            }
        ], function (err, result) {

            res.render('query/' + qtype, {
                dsID: req.params.eid,
                tags: err ? null : result
            });
        });
    });

    app.get('/endpoint/:eid/:typ', ensureLoggedIn('/login'), Auth.hasAccToDB, function (req, res) {

        if (!req.attach.dataset) return res.redirect(req.get('referer'));

        var query = req.query.query || req.body.query,
            mime = req.query.format || req.body.format,
            modname = req.query.modname || req.body.modname, //for mongodb
            qtyp = req.params.typ,
            ds = req.attach.dataset;

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

        qlog.ds = ds.url;
        var queryDriver = queries.drivers[ds.querytype.toLowerCase()];
        if (!queryDriver) {
            req.flash('error', ['Dataset type not supported']);
            return res.redirect(req.get('referer'));
        } else
        //TODO implement queryDriver as middlelayer
            queryDriver(query, mime === 'display' ? 'text/csv' : mime, ds,
                function (err, result) {
                    //qlog.result = JSON.stringify(result);
                    logger.info(qlog);
                    if (err) {
                        req.flash('error', [err.message]);
                        return res.redirect(req.get('referer'));
                    }

                    if (mime === 'display') {
                        var viewer = 'csvview';
                        if (qtyp === 'mongodb' || qtyp === 'sql') viewer = 'jsonview';
                        res.render('query/' + viewer, {
                            'result': result,
                            'info': req.flash('info'),
                            'error': req.flash('error')
                        });
                    } else {
                        res.attachment('result.txt');
                        res.end(result, 'UTF-8');
                    }
                }
            );
    });

    app.get('/contest', ensureLoggedIn('/login'), function (req, res) {
        var test = queries.tests[req.query.typ];
        if (!test) return res.json({
            message: 'Dataset type not supported'
        });
        test({
            url: req.query.url,
            user: req.query.user,
            password: req.query.pwd
        }, function (msg) {
            res.json(msg);
        });
    });
    //authentication

    app.get("/login", function (req, res) {
        if (!req.session.returnTo)
            req.session.returnTo = req.get('referer');

        res.render("login", {
            info: req.flash('info'),
            error: req.flash('error'),
            remember_me: req.cookies.remember_me ? true : false
        });
    });

    app.post("/login", passport.authenticate('local', {
        //successReturnToOrRedirect: '/',
        failureRedirect: "/login",
        failureFlash: true
    }), Auth.rememberMe, function (req, res) {
        var url = '/';
        if (req.session && req.session.returnTo) {
            url = req.session.returnTo;
            delete req.session.returnTo;
        }
        return res.redirect(url);
    });

    app.get("/signup", function (req, res) {
        var recaptcha = new Recaptcha(pbk, prk);
        res.render('signup', {
            layout: false,
            recaptcha_form: recaptcha.toHTML()
        });
    });

    app.post("/signup", Auth.userExist, function (req, res, next) {
        var data = {
            remoteip: req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response: req.body.recaptcha_response_field
        };

        var recaptcha = new Recaptcha(pbk, prk, data);
        recaptcha.verify(function (success, error_code) {
            if (success) {
                User.signup(req.body.fn, req.body.ln, req.body.org, req.body.email, req.body.password, function (err, user) {
                    if (err) throw err;
                    req.login(user, function (err) {
                        if (err) return next(err);
                        return res.redirect("/profile");
                    });
                });
            } else {
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


    app.post('/login/soton', passport.authenticate('ldapauth', {
        failureRedirect: '/login',
        failureFlash: true,
        successReturnToOrRedirect: '/'
    }), Auth.rememberMe);

    //profile
    app.get("/profile", ensureLoggedIn('/login'), function (req, res) {

        req.user.populate('own').populate('accreq').populate('clients').populate('pendingreq.entry', function (err, user) {
            var parameter = {
                'user': user
            };
            var errmsg = req.flash('error');
            if (err) {
                errmsg.push(err.message);
            } else {
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
    app.post("/profile", ensureLoggedIn('/login'), function (req, res) {
        var oldpw = req.body.oldpw,
            newpw = req.body.newpw,
            fn = req.body.fn,
            ln = req.body.ln,
            org = req.body.org,
            user = req.user,
            email = user.email;

        if (newpw) {
            User.isValidUserPassword(email, oldpw, function (err, user, msg) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                }

                if (!user) { //should not happen
                    req.flash('error', [msg.message]);
                    return res.redirect(req.get('referer'));
                }

                User.updateProfile(user, newpw, fn, ln, org, function (err) {
                    if (err) {
                        req.flash('error', [err.message]);
                        return res.redirect(req.get('referer'));
                    } else {
                        req.flash('info', ['Profile updated']);
                        return res.redirect(req.get('referer'));
                    }
                });
            });
        } else {
            User.updateProfile(user, null, fn, ln, org, function (err) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                } else {
                    req.flash('info', ['Profile updated']);
                    return res.redirect(req.get('referer'));
                }
            });
        }
    });

    //remove messages
    app.post('/profile/message', ensureLoggedIn('/login'), function (req, res) {
        var msgid = req.body.msgid,
            user = req.user;

        if ('string' === typeof msgid) msgid = [msgid];

        msgid.forEach(function (mid) {
            user.msg.remove(msgid[mid]);
        });

        user.save(function (err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            req.flash('info', ['Messages cleared']);
            res.redirect(req.get('referer'));
        });
    });

    //reseting password
    app.get('/profile/reset-pass', function (req, res) {
        var tk = req.query.tk;
        if (!tk) {
            req.flash('error', ['Password reset token is missing, please request again.']);
            return res.redirect('/login');
        }

        res.render('reset-pass', {
            'tk': tk
        });
    });

    app.post('/profile/reset-pass', function (req, res) {
        var tk = req.body.tk,
            confpass = req.body.confirm,
            newpass = req.body.password;

        if (newpass !== confpass) {
            req.flash('error', ['Passwords do not match']);
            return res.redirect(req.get('referer'));
        }

        pass.resetPass(tk, newpass, function (err, user) {
            if (err || !user) {
                req.flash('error', [err.message || 'User not found']);
                return res.redirect('/login');
            }
            req.login(user, function (err) {
                if (err) {
                    req.flash('error', [err.message]);
                    req.flash('error', ['An error occured, please login manually.']);
                    return res.redirect('/login');
                }
                res.redirect('/');
            });
        });
    });

    app.get('/profile/forgot-pass', function (req, res) {
        res.render('forgot-pass', {
            'info': req.flash('info'),
            'error': req.flash('error')
        });
    });

    app.post('/profile/forgot-pass', function (req, res) {
        pass.forgotPass(req.body.email, 'http://' + req.host + ':' + app.get('port') + '/profile/reset-pass', function (err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect('/profile/forgot-pass');
            }
            req.flash('info', ['Please check your email to reset your password.']);
            res.redirect('/login');
        });
    });

    app.get('/logout', function (req, res) {
        res.clearCookie('remember_me');
        req.logout();
        res.redirect('/');
    });

    app.get('/version', function (req, res) {
        res.render("version", {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user
        });
    });
    //API
    app.get('/api/info', cors(), function (req, res) {
        res.send('This is not implemented yet');
    });

    app.get('/api/query', cors(), passport.authenticate('bearer', {
        session: false
    }), Auth.hasAccToDB, function (req, res) {

        var ds = req.attach.dataset;

        if (!ds)
            return res.send({
                error: req.flash('error')
            });

        var query = req.query.query;

        var qlog = {};
        qlog.time = new Date();
        qlog.ip = req.connection.remoteAddress;
        qlog.query = query;
        qlog.usrmail = req.user.email;

        qlog.ds = ds.url;
        var queryDriver = queries.drivers[ds.querytype.toLowerCase()];
        if (!queryDriver) {
            return res.send({
                error: ['Dataset type not supported']
            });
        } else {
            //TODO implement queryDriver as middlelayer
            queryDriver(query, 'json', ds,
                function (err, result) {
                    //qlog.result = JSON.stringify(result);
                    logger.info(qlog);
                    if (err) {
                        return req.send({
                            error: [err.message]
                        });
                    }
                    res.send({
                        result: result
                    });
                }
            );
        }
    });

    app.get('/api/stats', cors(), passport.authenticate('bearer', {
        session: false
    }), function (req, res) {
        var sequence = {};

        Entry.find({}, function (err, entries) {
            for (var i = 0; i < entries.length; i++) {
                var etry = entries[i];
                var type = etry.type;
                var additional = etry.querytype;
                var key = type;
                if (type === 'dataset') key = key + '-' + additional;
                if (!sequence[key]) {
                    sequence[key] = 1;
                } else {
                    sequence[key] = sequence[key] + 1;
                }
            }
            res.send(sequence);
        });
    });

    app.get('/api/userInfo', cors(), passport.authenticate('bearer', {
        session: false
    }), function (req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.  For illustrative purposes, this
        // example simply returns the scope in the response.
        res.json({
            user_id: req.user._id,
            email: req.user.email,
            scope: req.authInfo.scope
        });
    });

    //Oauth
    app.get('/oauth/authorise', cors(), ensureLoggedIn('/login'), oauth2.authorise, function (req, res) {
        res.render('oauth-authorise', {
            transactionID: req.oauth2.transactionID,
            user: req.user,
            client: req.oauth2.client
        });
    });

    app.post('/oauth/decision', ensureLoggedIn('/login'), oauth2.decision);

    app.post('/oauth/token', cors(), oauth2.token);

    //application management

    app.get('/client/create', ensureLoggedIn('/login'), function (req, res, next) {
        var user = req.user;

        var secret = crypto.randomBytes(8).toString('hex');

        var client = new Client({
            name: req.query.name,
            clientSecret: secret,
            owner: user.email,
            redirectURI: req.query.callback
        });

        client.save(function (err) {
            if (err) return next(err);

            user.clients.push(client._id);
            user.save(function (err) {
                if (err) return next(err);

                res.redirect(req.get('referer')); //use ajax
            });
        });
    });

    app.get('/client/:eid/delete', Auth.isOwner, function (req, res, next) {
        var user = req.user,
            cid = req.params.eid;

        Client.findByIdAndRemove(cid, function (err) {
            if (err) next(err);
        });

        user.clients.pull(cid);
        user.save(function (err) {
            if (err) next(err);

            res.redirect(req.get('referer')); //use ajax
        });
    });

    app.get('/client/:eid/edit', Auth.isOwner, function (req, res) {

    });
};
