"use strict";
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Entry = mongoose.model('Entry'),
    Client = mongoose.model('Client'),
    Auth = require('./middlewares/authorization.js'),
    file = require('./middlewares/dataset/file.js'),
    async = require('async'),
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
    config = require('./config').development,
    Recaptcha = require('recaptcha').Recaptcha,
    pbk = config.recap_pbk, //'6LfwcOoSAAAAACeZnHuWzlnOCbLW7AONYM2X9K-H'
    prk = config.recap_prk, //'6LfwcOoSAAAAAGFI7h_SJoCBwUkvpDRf7_r8ZA_D'
    pass = require('../app/util/pass'),
    logger = require('../app/util/logger'),
    crypto = require('crypto'),
    modctrl = require('./middlewares/modctrl'),
    accessdata = require('./middlewares/accessdata'),
    queries = require('./middlewares/dataset/queries'),
    cors = require('cors'),
    forceSSL = require('./middlewares/utils').forceSSL,
    noneSSL = require('./middlewares/utils').noneSSL,
    oauth2 = require('../oauth/oauth2server'),
    connTest = require('./middlewares/connTest'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    git = require('./middlewares/github/github');

<<<<<<< HEAD
module.exports = function(app, passport) {
=======

module.exports = function (app, passport) {
>>>>>>> dev_jd

    app.options('*', cors()); //for pre-flight cors

    app.get("/", function(req, res) {
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
    app.get('/wo/:typ(dataset|visualisation)', connTest, modctrl.visibleEtry, function(req, res) {
        var baseUrl = req.protocol + '://' + req.get('host');

        res.render('catlg', {
            info: req.flash('info'),
            error: req.flash('error'),
            baseUrl: baseUrl,
            user: req.user,
            table: req.attach.visibleEntries,
            type: req.params.typ
        });
    });

    //catalogue right panel
    app.get('/wo/:eid', function(req, res) {
        var email = req.user ? req.user.email : null,
            eid = req.params.eid;
        Entry.findById(eid, function(err, entry) {
            entry.isOwner = false;
            entry.haveAcc = entry.opAcc;

            if (err || !entry) {
                return res.send(err.message || 'No record found');
            }

            if (!entry.opVis && email !== entry.publisher) {
                return res.send('Permission denied to show this entry');
            }

            if (email && email === entry.publisher) {
                //short cut fields for display
                entry.isOwner = true;
                entry.haveAcc = true;
            }

            if (!entry.opAcc) {
                if (req.user && req.user.readable && req.user.readable.indexOf(eid) !== -1) {
                    entry.haveAcc = true;
                }
            }


            var qtype = entry.mediatype.toLowerCase();
            switch (qtype) {
                case 'mysql':
                    qtype = 'sql';
                    break;
                case 'postgressql':
                    qtype = 'sql';
                    break;
            }

            async.waterfall([
                function(cb) {
                    if (qtype === 'mongodb') {
                        Entry.findById(req.params.eid, function(err, ds) {
                            if (err) {
                                return cb(err);
                            }
                            queries.mongodbschema(ds, cb);
                        });
                    } else {
                        cb(null, null);
                    }
                }
            ], function(err, result) {
                res.render('query/' + qtype, {
                    eid: entry._id,
                    url: entry.url,
                    tags: err ? null : result
                }, function(err, qrypanl) {
                    res.render('catlog-detail', {
                        qrypanl: qrypanl,
                        etry: entry
                    });
                });
            });
        });
    });

    //display vis
    //TODO use pipe?
    app.get('/wo/show/:eid', noneSSL, function(req, res, next) {
        Entry.findById(req.params.eid, function(err, entry) {
            if (err) {
                return next(err);
            }

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

    //statistics of listed entries
    app.get('/stats', function(req, res) {
        var sequence = {},
            i;

        Entry.find({}, function(err, entries) {
            if (err) {
                logger.error(err);
            }
            var key, additional, type, entry;
            for (i = 0; i < entries.length; i += 1) {
                entry = entries[i];
                type = entry.type;
                additional = entry.querytype;
                key = type;
                if (type === 'dataset') {
                    key = key + '-' + additional;
                }
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

    app.get('/add/:typ(dataset|visualisation)', noneSSL, modctrl.licenses, ensureLoggedIn('/login'), function(req, res) {
        res.render('addetry', {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user,
            licenses: req.attach.licenses,
            type: req.params.typ
        });
    });

    //data file uploading
    app.post('/upload', ensureLoggedIn('/login'), file.fileUpload);
    //uploading zip and unzip
    app.post('/uploadzip', ensureLoggedIn('/login'), file.fileUploadzip);

    //data file download
    app.get('/download/:eid', ensureLoggedIn('/login'), Auth.hasAccToDB, file.fileDownload);


    //searching
    app.get('/search', function(req, res) {
        var term = req.query.keyword;

        if (!term) {
            return res.render('search', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user
            });
        }

        Entry.find({
            type: 'dataset',
            name: {
                $regex: term,
                $options: 'i'
            }
        }, function(err, entries) {
            if (err) {
                req.flash('error', [err.message]);
            }
            if (!entries || 0 === entries.length) {
                req.flash('error', 'No records found');
            }
            res.render('search', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                entries: entries
            });
        });
    });

    //howto guide of the portal
    app.get('/howto', function(req, res) {
        res.render('howto', {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user
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
            if (err) {
                logger.error(err);
            }
            var names = etries.map(function(etry) {
                return etry.name;
            });
            res.json(names);
        });
    });

    //add an entry
    app.post('/add/:typ(dataset|visualisation)', ensureLoggedIn('/login'), git, function(req, res) {
        var etry, user = req.user,
            body = req.body;
        etry = {
            url: body.url,
            auth: {
                user: body.user,
                encpwd: body.pwd,
                apikey: body.apikey
            },
            name: body.name,
            type: req.params.typ,
            querytype: body.querytype || 'HTML',
            desc: body.desc,
            queryinfo: body.queryinfo,
            publisher: user.email,
            publisher_name: user.username || ((user.firstName ? user.firstName + ' ' : '') + (user.lastName || '')),
            related: body.basedOn,
            git: body.git,
            lice: body.lice,
            kw: body.kw ? req.body.kw.split(',') : [],
            des: body.des,
            canView: [user.email],
            canAccess: [user.email],
            opAcc: body.acc !== 'false',
            opVis: body.vis !== 'false'
        };

        modctrl.addEtry(user, etry, function(err) {
            if (err) {
                req.flash('error', [err.message]);
                res.redirect('/add/' + req.params.typ);
            } else {
                req.flash('info', ['New entry added']);
                res.redirect('/wo/' + req.params.typ);
            }
        });
    });

    app.get('/detail/:eid', ensureLoggedIn('/login'), function(req, res) {
        Entry.findOne({
            _id: req.params.eid,
            publisher: req.user.email
        }, function(err, entry) {
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

    app.post('/detail/:eid', Auth.isOwner, function(req, res, next) {
        var eid = req.params.eid,
            name = req.body.name,
            value = req.body.value.trim(),
            etry = {};


        switch (name) {

            case 'opAcc':
                etry.opAcc = value === '1';
                break;

            case 'opVis':
                etry.opVis = value === '1';
                break;

            default:
                etry[name] = value;
        }

        modctrl.editEtry(eid, etry, function(err) {
            if (err) {
                console.error(err);
                res.send(400, err.message);
            } else {
                if (etry.git) {
                    req.body.git = etry.git;
                    return next();
                }
                res.status(200).end();
            }
        });
    }, git, function(req, res) {
        res.status(200).end();
    });

    //    app.get('/edit/:eid', ensureLoggedIn('/login'), function (req, res) {
    //
    //        var eid = req.params.eid;
    //
    //        Entry.findOne({
    //            _id: eid,
    //            publisher: req.user.email
    //        }, function (err, entry) {
    //            if (err || !entry) {
    //                logger.error(err || {
    //                    message: 'Entry not found under the current user'
    //                });
    //                req.flash('error', ["Entry not found under the current user"]);
    //                //use ajax rather than refreshing
    //                return res.redirect('profile');
    //            }
    //
    //            res.render('editetry', {
    //                info: req.flash('info'),
    //                error: req.flash('error'),
    //                user: req.user,
    //                data: entry
    //            });
    //        });
    //    });

    //    app.post('/edit/:eid', Auth.isOwner, function (req, res) {
    //        var eid, etry;
    //        eid = req.params.eid;
    //        etry = {};
    //
    //        switch (true) {
    //            case req.body.url:
    //                etry.url = req.body.url;
    //                break;
    //            case req.body.name:
    //                etry.name = req.body.name;
    //                break;
    //            case req.body.des:
    //                etry.des = req.body.des;
    //                break;
    //            case req.body.lice:
    //                etry.lice = req.body.lice;
    //                break;
    //            case req.body.creator:
    //                etry.creator = req.body.creator;
    //                break;
    //            case 'publisher':
    //                etry.publisher_name = req.body.value;
    //                break;
    //            case req.body.git:
    //                etry.git = req.body.git;
    //                break;
    //            case req.body.related:
    //                etry.related = req.body.related;
    //                break;
    //            case req.body.kw:
    //                etry.kw = req.body.kw.split(',');
    //                break;
    //            default:
    //                etry.opVis = !req.body.vis;
    //                etry.opAcc = !req.body.acc;
    //        }
    //
    //        modctrl.editEtry(eid, etry, function (err) {
    //            if (err) {
    //                req.flash('error', [err.message]);
    //                res.redirect(req.get('referer'));
    //            } else {
    //                req.flash('info', ['Entry edited']);
    //                res.redirect('/profile');
    //            }
    //        });
    //    });

    //remove entries
    app.get('/remove/:eid', ensureLoggedIn('/login'), function(req, res) {
        var ids = req.params.eid.split(','),
            user = req.user;

        if (!ids) {
            req.flash('error', ['No entry selected']);
            return res.redirect(req.get('referer'));
        }

        if ('string' === typeof ids) {
            ids = [ids];
        }

        async.map(ids, function(eid, cb) {
            if (-1 !== user.own.indexOf(eid)) {
                Entry.findByIdAndRemove(eid, cb);
                user.own.pull(eid);
            }
        }, function(err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            user.save(function(err) {
                if (err) {
                    req.flash('error', [err.message]);
                } else {
                    req.flash('info', ['Entry deleted successfully']);
                }
                return res.redirect(req.get('referer'));
            });
        });
    });

    //request access of datasets
    app.get('/reqacc/:eid', ensureLoggedIn('/login'), function(req, res) {
        var eids = [req.params.eid];
        var smtpTransport = nodemailer.createTransport(config.smtp);

        modctrl.reqAccToEtry(eids, req.user, function(err) {
            if (err) {
                req.flash('error', [err.message]);
            } else {
                req.flash('info', ['Request sent']); //TODO add send mail
        
        async.map(eids, function (eid, next) {
        Entry.findById(eid, function (err, entry) {
            if (err) {
                return next(err);
            }
            if (!entry) {
                return next({message: 'Entry not found'});
            }
            var mailOptions = {
                from: req.user.email, // sender address
                to: entry.publisher,
                subject: "[Web-Observatory] Access Request", // Subject line
                html: req.user.firstName +" "+req.user.lastName +" ("+req.user.email +") would like to access your dataset/visualisation listed on Web Observatory. Please <a href='https://"+req.headers.host+"/profile#requests'>login</a> to Grant or Deny this request. " // html body
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                if (err) {
                    return next(err);
                }

            });


        })
        });//map end

            }

            res.render('includes/flash-banner', {
                info: req.flash('info'),
                error: req.flash('error')
            });
        });
    });

    app.post('/reqacc', ensureLoggedIn('/login'), function(req, res) {
        var user = req.user,
            eids = req.body.ids;
        if (!eids) {
            req.flash('info', ['No entry selected']);
            res.redirect(req.get('referer'));
        }
        if (typeof eids === 'string') {
            eids = [eids];
        }

        modctrl.reqAccToEtry(eids, user, function(err) {
            if (err) {
                req.flash('error', [err.message]);
            } else {
                req.flash('info', ['Request sent']);
            }
            res.redirect(req.get('referer'));
        });
    });

    //approve access to datasets
    app.post('/aprvacc', ensureLoggedIn('/login'), function(req, res) {
        var deny = req.body.deny === 'true',
            user = req.user,
            reqids = req.body.reqids;
        if ('string' === typeof reqids) {
            reqids = [reqids];
        }

        modctrl.aprvAccToEtry(deny, reqids, user, function(err) {

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
    app.get('/schematags', ensureLoggedIn('/login'), function(req, res) {
        Entry.findById(req.query.dsId, function(err, ds) {
            if (err) {
                logger.error(err);
            }
            queries.mongodbschema(ds, function(err, names) {
                if (err) {
                    logger.error(err);
                }
                res.json(names);
            });
        });
    });

    //execute user queries
    app.get('/query/:format/:eid', function(req, res) {
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

            function(cb) {
                if (qtype === 'mongodb') {
                    Entry.findById(req.params.eid, function(err, ds) {
                        if (err) {
                            return cb(err);
                        }
                        queries.mongodbschema(ds, cb);
                    });
                } else {
                    cb(null, null);
                }
            }
        ], function(err, result) {
            res.render('query/' + qtype, {
                eid: req.params.eid,
                tags: err ? null : result
            });
        });
    });

    app.get('/endpoint/:eid/:typ', Auth.hasAccToDB, accessdata);

    app.get('/contest', ensureLoggedIn('/login'), function(req, res) {
        var test = queries.tests[req.query.typ];
        if (!test) {
            return res.json({
                message: 'Dataset type not supported'
            });
        }
        test({
            url: req.query.url,
            user: req.query.user,
            password: req.query.pwd
        }, function(msg) {
            res.json(msg ? msg.toString() : null);
        });
    });

    app.get('/git/:uid/:repo', function(req, res) {
        var uid = req.params.uid,
            repo = req.params.repo;
        res.render(uid + '/' + repo);
    });

    //authentication

    app.get("/login", forceSSL, function(req, res) {
        if (!req.session.returnTo) {
            req.session.returnTo = req.get('referer');
        }

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
    }), Auth.rememberMe, function(req, res) {
        var url = '/';
        if (req.session && req.session.returnTo) {
            url = req.session.returnTo;
            delete req.session.returnTo;
        }
        return res.redirect(url);
    });

    app.get("/signup", forceSSL, function(req, res) {
        var recaptcha = new Recaptcha(pbk, prk, req.secure);
        res.render('signup', {
            layout: false,
            recaptcha_form: recaptcha.toHTML()
        });
    });

    app.post("/signup", Auth.userExist, function(req, res, next) {
        var data, recaptcha;
        data = {
            remoteip: req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response: req.body.recaptcha_response_field
        };

        recaptcha = new Recaptcha(pbk, prk, data);
        recaptcha.verify(function(success) {
            if (success) {
                User.signup(req.body.fn, req.body.ln, req.body.org, req.body.email, req.body.password, function(err, user) {
                    if (err) {
                        return next(err);
                    }
                    req.login(user, function(err) {
                        if (err) {
                            return next(err);
                        }
                        return res.redirect("/");
                    });
                });
            } else {
                req.flash('error', ['Recaptcha not valid.']);
                res.render('signup', {
                    error: req.flash('error'),
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
    app.get("/profile", forceSSL, ensureLoggedIn('/login'), function(req, res) {

        req.user.populate('own').populate('accreq').populate('clients').populate('pendingreq.entry', function(err, user) {
            var parameter, errmsg;
            parameter = {
                'user': user
            };
            errmsg = req.flash('error');
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
    app.post("/profile", ensureLoggedIn('/login'), function(req, res) {
        var oldpw = req.body.oldpw,
            newpw = req.body.newpw,
            fn = req.body.fn,
            ln = req.body.ln,
            org = req.body.org,
            user = req.user,
            email = user.email;

        if (newpw) {
            User.isValidUserPassword(email, oldpw, function(err, user, msg) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                }

                if (!user) { //should not happen
                    req.flash('error', [msg.message]);
                    return res.redirect(req.get('referer'));
                }

                User.updateProfile(user, newpw, fn, ln, org, function(err) {
                    if (err) {
                        req.flash('error', [err.message]);
                        res.redirect(req.get('referer'));
                    } else {
                        req.flash('info', ['Profile updated']);
                        return res.redirect(req.get('referer'));
                    }
                });
            });
        } else {
            User.updateProfile(user, null, fn, ln, org, function(err) {
                if (err) {
                    req.flash('error', [err.message]);
                    res.redirect(req.get('referer'));
                } else {
                    req.flash('info', ['Profile updated']);
                    return res.redirect(req.get('referer'));
                }
            });
        }
    });

    //remove messages
    app.post('/profile/message', ensureLoggedIn('/login'), function(req, res) {
        var msgid = req.body.msgid,
            user = req.user;

        if ('string' === typeof msgid) {
            msgid = [msgid];
        }

        msgid.forEach(function(mid) {
            user.msg.remove(msgid[mid]);
        });

        user.save(function(err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            req.flash('info', ['Messages cleared']);
            res.redirect(req.get('referer'));
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

    app.post('/profile/forgot-pass', pass.forgotPass);

    app.get('/logout', function(req, res) {
        res.clearCookie('remember_me');
        req.logout();
        res.redirect('/');
    });

    app.get('/version', function(req, res) {
        res.render("version", {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user
        });
    });

    //application management

    app.get('/client/create', ensureLoggedIn('/login'), function(req, res, next) {
        var client, user, secret;

        user = req.user;

        secret = crypto.randomBytes(8).toString('hex');

        client = new Client({
            name: req.query.name,
            clientSecret: secret,
            owner: user.email,
            redirectURI: req.query.callback
        });

        client.save(function(err) {
            if (err) {
                return next(err);
            }

            user.clients.push(client._id);
            user.save(function(err) {
                if (err) {
                    return next(err);
                }

                res.redirect(req.get('referer')); //use ajax
            });
        });
    });

    app.get('/client/:eid/delete', Auth.isOwner, function(req, res, next) {
        var user = req.user,
            cid = req.params.eid;

        Client.findByIdAndRemove(cid, function(err) {
            if (err) {
                next(err);
            }
        });

        user.clients.pull(cid);
        user.save(function(err) {
            if (err) {
                next(err);
            }

            res.redirect(req.get('referer')); //use ajax
        });
    });

    //API
    //    var buildLinks = function (req, res, next) {
    //        var base, links;
    //
    //        base = req.protocol + '://' + req.get('host');//TODO build base from app.js
    //
    //        links = [
    //            {href: base + req.path, rel: 'self', method: 'GET'}
    //        ];
    //
    //        req.attach = req.attach || {};
    //        req.attach.links = links;
    //        next();
    //    };

    app.get('/api', cors(), function(req, res) {
        var base, apiRes, links; // use base instead of baseUrl to prevent confusion with req.baseUrl
        base = req.protocol + '://' + req.get('host');
        links = [{
            href: base + req.path,
            rel: 'self',
            method: 'GET'
        }, {
            href: base + '/oauth/token',
            rel: 'oauth/token',
            method: 'POST'
        }, {
            href: base + '/oauth/authorise',
            rel: 'oauth/auth',
            method: 'GET'
        }, {
            href: base + '/api/wo',
            rel: 'list',
            method: 'GET'
        }, {
            href: base + '/api/wo/dataset',
            rel: 'list',
            method: 'GET'
        }, {
            href: base + '/api/wo/visualisation',
            rel: 'list',
            method: 'GET'
        }];

        apiRes = {
            version: '0.1',
            auth: 'OAuth2.0',
            links: links
        };
        res.send(apiRes);
    });

    app.get('/oauth', cors(), function(req, res) {
        var base, apiRes, links; // use base instead of baseUrl to prevent confusion with req.baseUrl
        base = req.protocol + '://' + req.get('host');

        links = [{
            href: base + req.path,
            rel: 'self',
            method: 'GET'
        }, {
            href: base + '/oauth/token',
            rel: 'oauth/token',
            method: 'POST'
        }, {
            href: base + '/oauth/authorise',
            rel: 'oauth/auth',
            method: 'GET'
        }];

        apiRes = {
            links: links
        };
        res.send(apiRes);
    });

    app.get('/api/info', cors(), function(req, res) {
        res.send('This is not implemented yet');
    });

    app.get('/api/wo/:typ(dataset|visualisation)', cors(), modctrl.visibleEtry, function(req, res) {
        var entries = req.attach.visibleEntries;
        res.send(entries);
    });

    //cors with preflight doesn't allow redirection  
    //legacy entry, kept for backward compatibility
    app.get('/api/query', cors(), passport.authenticate('bearer', {
        session: false
    }), Auth.hasAccToDB, function(req, res) {

        var queryDriver, qlog, ds, query;

        ds = req.attach.dataset;

        if (!ds) {
            return res.send({
                error: req.flash('error')
            });
        }

        query = req.query.query;

        qlog = {};
        qlog.time = new Date();
        qlog.ip = req.connection.remoteAddress;
        qlog.query = query;
        qlog.usrmail = req.user.email;

        qlog.ds = ds.url;
        queryDriver = queries.drivers[ds.querytype.toLowerCase()];
        if (!queryDriver) {
            res.send({
                error: ['Dataset type not supported']
            });
        } else {
            //TODO implement queryDriver as middlelayer
            queryDriver(query, '', ds,
                function(err, result) {
                    //qlog.result = JSON.stringify(result);
                    logger.info(qlog);
                    if (err) {
                        return res.send({
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

    app.get('/api/wo/:eid/query', cors(), passport.authenticate('bearer', {
        session: false
    }), Auth.hasAccToDB, accessdata);

    app.get('/api/wo/:eid/endpoint', cors(), passport.authenticate('bearer', {
        session: false
    }), Auth.hasAccToDB, accessdata);

    app.get('/api/stats', cors(), passport.authenticate('bearer', {
        session: false
    }), function(req, res) {
        var i, sequence = {};

        Entry.find({}, function(err, entries) {
            if (err) {
                logger.error(err);
            }
            var etry, type, additional, key;

            for (i = 0; i < entries.length; i += 1) {
                etry = entries[i];
                type = etry.type;
                additional = etry.querytype;
                key = type;
                if (type === 'dataset') {
                    key = key + '-' + additional;
                }
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
    }), function(req, res) {
        // req.authInfo is set using the `info` argument supplied by
        // `BearerStrategy`.  It is typically used to indicate scope of the token,
        // and used in access control checks.
        res.json({
            user_id: req.user._id,
            email: req.user.email,
            scope: req.authInfo.scope
        });
    });

    //Oauth
    app.get('/oauth/authorise', ensureLoggedIn('/login'), oauth2.authorise, function(req, res) {
        res.render('oauth-authorise', {
            transactionID: req.oauth2.transactionID,
            user: req.user,
            scope: req.authInfo.scope,
            client: req.oauth2.client
        });
    });

    app.post('/oauth/decision', ensureLoggedIn('/login'), oauth2.decision);

    app.post('/oauth/token', cors(), oauth2.token);

    //app.get('/client/:eid/edit', Auth.isOwner, function (req, res) {  });
};
