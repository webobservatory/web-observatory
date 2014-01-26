var User = require('../app/models/user');
var Entry = require('../app/models/entry');
var Auth = require('./middlewares/authorization.js');
var async = require('async');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var sparql = require('./middlewares/sparql.js');
var SPARQLGetContent = sparql.SPARQLGetContent;
var SPARQLUpdate = sparql.SPARQLUpdateContent;
var SPARQLUpdateStatus = sparql.SPARQLUpdateStatus;
var Recaptcha = require('recaptcha').Recaptcha;
var pbk = '6LfwcOoSAAAAACeZnHuWzlnOCbLW7AONYM2X9K-H';
var prk = '6LfwcOoSAAAAAGFI7h_SJoCBwUkvpDRf7_r8ZA_D';
var pass = require('../app/util/pass');
var logger = require('../app/util/logger');
var modctrl = require('../app/controllers/modctrl');

module.exports = function(app, passport) {

    //list entries
    app.get('/catlg/:typ(dataset|visualisation)', function(req, res) {
        var email = req.user ? req.user.email : null;
        modctrl.visibleEtry(email, req.params.typ, function(err, entries) {
            if (err) req.flash('error', [err.message]);
            res.render('catlg', {
                info: req.flash('info'),
                error: req.flash('error'),
                user: req.user,
                table: entries,
                type: req.params.typ,
                scripts: ['/js/jquery.dataTables.js', '/js/catalogue.jade.js', '/js/paging.js']
            });
        });
    });

    app.get('/add/:typ(dataset|visualisation)', ensureLoggedIn('/login'), function(req, res) {
        res.render('addetry', {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user,
            type: req.params.typ,
            scripts: []
        });
    });
    //add entry
    app.post('/add/:typ(dataset|visualisation)', ensureLoggedIn('/login'), function(req, res) {
        var email = req.user.email;
        var etry = {
            url: req.body.url,
            name: req.body.name,
            type: req.params.typ,
            desc: req.body.desc,
            publisher: email,
            //community: req.body.community,
            lice: req.body.lice,
            kw: req.body.kw.split(','),
            des: req.body.des
        };

        modctrl.addEtry(email, etry, function(err) {
            if (err) {
                req.flash('error', [err.message]);
                res.redirect('/add/' + req.params.typ);
            } else {
                req.flash('info', ['New entry added']);
                res.redirect('/catlg/' + req.params.typ);
            }
        });
    });

    app.post('/edit', ensureLoggedIn('/login'), function(req, res) {
        var email = req.user.email;
        var etry_id = req.body.eid;
        var etry = {
            /*
            url: req.body.url,
            name: req.body.name,
            //community: req.body.community,
            lice: req.body.lice,
            kw: req.body.kw.split(','),
            des: req.body.des
            */
        };

        if (req.body.url.trim()) etry.url = req.body.url;
        if (req.body.name.trim()) etry.name = req.body.name;
        if (req.body.des.trim()) etry.des = req.body.des;
        if (req.body.lice.trim()) etry.lice = req.body.lice;
        if (req.body.kw.trim()) etry.kw = req.body.kw.split(',');

        modctrl.editEtry(etry_id, etry, function(err) {
            if (err) {
                req.flash('error', [err.message]);
                res.redirect('/edit');
            } else {
                req.flash('info', ['Entry edited']);
                res.redirect(req.get('referer'));
            }
        });
    });

    //remove dataset
    app.post('remove', ensureLoggedIn('/login'), function(req, res) {
        var umail = req.user.email;
        var ids = req.body.remove;

        if (!ids) {
            req.flash('error', ['No entry selected']);
            return res.redirect(req.get('referer'));
        }

        if (typeof ids === 'string')
            ids = [ids];

        async.waterfall([
            function(cb) {
                User.findOne({
                    email: umail
                }, function(err, user) {
                    if (err || !user) {
                        return cb(err || {
                            message: 'User not logged in'
                        });
                    }

                    var urls = [];
                    for (i = 0; i < ids.length; i++) {
                        var dataset = user.owned.id(ids[i]);
                        urls.push(dataset.url);
                        dataset.remove();
                    }
                    user.save(function(err) {
                        cb(err, urls);
                    });
                });
            },
            function(urls, cb) {
                logger.info('URLs: ' + urls);
                sparql.removeByIds(urls, cb);
            }
        ], function(err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            req.flash('info', [ids.length + ' datasets removed']);
            res.redirect(req.get('referer'));
        });
    });

    //request access of datasets
    app.post('/dataset/reqaccess', ensureLoggedIn('/login'), function(req, res) {
        var sender_mail = req.user.email,
            dt_ids = req.body.ids;
        if (typeof dt_ids === 'string')
            dt_ids = [dt_ids];
        async.map(dt_ids, function(dtid, cb) {
            User.findOne({
                'owned._id': dtid
            }, function(err, user) {
                if (err)
                    return cb(err);
                if (!user)
                    return cb({
                        message: 'No publisher found for requested dataset' + dtid
                    });
                var dt = user.owned.id(dtid);
                User.addReq(sender_mail, dt, cb);
            });
        }, function(err, req_dts) {
            if (err) {
                req.flash('error', [err.message]);
                res.redirect(req.get('referer'));
            } else {
                req.flash('info', ['Request sent']);
                var update = {
                    $addToSet: {
                        requested: {
                            $each: req_dts
                        }
                    }
                };

                User.update({
                    email: sender_mail
                }, update, function(err, user) {
                    if (err)
                        req.flash('error', [err.message]);
                    res.redirect(req.get('referer'));
                });
            }
        });
    });

    //approve access to datasets
    app.post('/dataset/approve', ensureLoggedIn('/login'), function(req, res) {
        var clr = req.body.clr === 'true',
            umail = req.user.email,
            reqids = req.body.reqids;
        if (typeof reqids === 'string')
            reqids = [reqids];

        User.findOne({
            email: umail
        }, function(err, user) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }

            async.map(reqids, function(rid, cb) {
                var rst = user.msg.requests.id(rid);
                User.accCtrl(clr, rst, cb);

            }, function(err, requests) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect(req.get('referer'));
                }
                User.rmReq(umail, requests, function(err, user) {
                    if (err)
                        req.flash('error', [err.message]);
                    else
                        req.flash('info', [clr ? 'Request denied' : 'Access granted']);
                    res.redirect(req.get('referer'));
                });
            });
        });
    });

    //TODO edit datasets' metadata
    app.post('/dataset/edit', ensureLoggedIn('/login'), function(req, res) {
        var umail = req.user.email,
            data = {
                url: req.body.origurl,
                title: req.body.title,
                newurl: req.body.url,
                creator: req.body.creator,
                desc: req.body.desc
            };

        var update = {};

        if (title)
            update['owned.$.title'] = title;
        if (url)
            update['owned.$.url'] = url;
        if (creator)
            update['owned.$.creator'] = creator;
        if (desc)
            update['owned.$.desc'] = desc;

        update = {
            $set: update
        };

        var query = {
            email: umail,
            'owned.url': data.url
        };

        async.series([
            function(cb) {
                sparql.updateMeta(data, cb);
            },
            function(cb) {
                User.update(query, update, cb);
            }
        ], function(err) {
            if (err)
                req.flash('error', [err.message]);
            else
                req.flash('info', ['Meta data updated']);
            res.redirect(req.get('referer'));
        });
    });

    //change datasets' access control
    app.post('/dataset/access', ensureLoggedIn('/login'), function(req, res) {
        var umail = req.user.email;
        var ids = Object.keys(req.body);

        async.map(ids, function(id, cb) {
            var isPrivate = req.body[id] === 'private';
            User.findOne({
                email: umail
            }, function(err, user) {
                var url = user.owned.id(id).url;
                SPARQLUpdateStatus({
                    'url': url,
                    'readable': !isPrivate
                }, function(err) {
                    if (err)
                        req.flash('error', [err.message]);
                });
            });
            var query = {
                email: umail,
                'owned._id': id
            };
            var update = {
                $set: {
                    'owned.$.readable': !isPrivate
                }
            };
            User.update(query, update, cb);
        }, function(err, results) {
            if (err || results === 0)
                req.flash('error', [err.message || 'No change made']);
            else
                req.flash('info', ['Dataset status changed']);
            res.redirect(req.get('referer'));
        });

    });

    //remove dataset
    app.post('/dataset/remove', ensureLoggedIn('/login'), function(req, res) {
        var umail = req.user.email;
        var ids = req.body.remove;

        if (!ids) {
            req.flash('error', ['No entry selected']);
            return res.redirect(req.get('referer'));
        }

        if (typeof ids === 'string')
            ids = [ids];

        async.waterfall([
            function(cb) {
                User.findOne({
                    email: umail
                }, function(err, user) {
                    if (err || !user) {
                        return cb(err || {
                            message: 'User not logged in'
                        });
                    }

                    var urls = [];
                    for (i = 0; i < ids.length; i++) {
                        var dataset = user.owned.id(ids[i]);
                        urls.push(dataset.url);
                        dataset.remove();
                    }
                    user.save(function(err) {
                        cb(err, urls);
                    });
                });
            },
            function(urls, cb) {
                logger.info('URLs: ' + urls);
                sparql.removeByIds(urls, cb);
            }
        ], function(err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            req.flash('info', [ids.length + ' datasets removed']);
            res.redirect(req.get('referer'));
        });
    });

    app.get('/wo/queries', ensureLoggedIn('/login'), function(req, res) {
        res.render('queries', {
            user: req.user,
            scripts: ['/js/query.jade.js']
        });
    });

    app.get('/wo/visualisations', function(req, res) {
        var email = req.user ? req.user.email : null;
        var errmsg = req.flash('error');

        async.waterfall([
            function(cb) {
                User.listVisualisations(email, cb);
            },
            function(owned, cb) {

                var visible = [];
                for (i = 0; i < owned.length; i++) {
                    visible.push(owned[i].url);
                }

                SPARQLGetContent('visualisations', visible, null, cb);
            }
        ], function(err, result) {
            if (err)
                errmsg.push(err.message);
            res.render('visualisations', {
                info: req.flash('info'),
                error: errmsg,
                user: req.user,
                table: result,
                scripts: ['/js/jquery-ui-1.10.3.min.js', '/js/jquery.dataTables.js', '/js/underscore-min.js', '/js/vis.js']
            });
        });
    });

    //add visualisations
    app.post('/wo/visualisations', ensureLoggedIn('/login'), function(req, res) {
        var data = {
            title: req.body.title,
            source: req.body.source,
            url: req.body.url,
            desc: req.body.desc,
            visible: req.body.visible,
            readable: 'false',
            creator: req.body.creator,
            username: req.user.username,
            email: req.user.email,
            addType: 'Visualisation'
        };

        async.series([
            function(cb) {
                SPARQLUpdate('visualisations', data, cb);
            },
            function(cb) {
                var vis = {
                    url: data.url,
                    title: data.title,
                    type: data.addType,
                    publisher: data.email,
                    readable: data.readable === 'true',
                    visible: data.visible === 'true'
                };
                User.addOwnVis(req.user.email, vis, cb);
            }
        ], function(err) {
            if (err)
                req.flash('error', [err.message]);
            else
                req.flash('info', ['Visualisation added succeffully']);
            res.redirect('/wo/visualisations');
        });
    });

    app.post('/visualisations/remove', ensureLoggedIn('/login'), function(req, res) {
        var umail = req.user.email;
        var ids = req.body.remove;

        if (!ids) {
            req.flash('error', ['No entry selected']);
            return res.redirect(req.get('referer'));
        }

        if (typeof ids === 'string')
            ids = [ids];

        async.waterfall([
            function(cb) {
                User.findOne({
                    email: umail
                }, function(err, user) {
                    if (err || !user) {
                        return cb(err || {
                            message: 'User not logged in'
                        });
                    }

                    var urls = [];
                    for (i = 0; i < ids.length; i++) {
                        var visualisation = user.ownedVis.id(ids[i]);
                        urls.push(visualisation.url);
                        visualisation.remove();
                    }
                    user.save(function(err) {
                        cb(err, urls);
                    });
                });
            },
            function(urls, cb) {
                logger.info('URLs: ' + urls);
                sparql.removeByIds(urls, cb);
            }
        ], function(err) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            req.flash('info', [ids.length + ' datasets removed']);
            res.redirect(req.get('referer'));
        });
    });
    app.get('/query/:format/:dsId', ensureLoggedIn('/login'), function(req, res) {
        res.render(req.params.format, {
            info: req.flash('info'),
            error: req.flash('error'),
            user: req.user,
            dsID: req.params.dsId,
            scripts: ['/js/sparql.jade.js', '/js/sparql.js']
        });
    });


    //execute users' queries
    app.get('/endpoint/:dsId/:typ', ensureLoggedIn('/login'), function(req, res) {
        var query = req.query.query,
            format = req.query.format,
            _id = req.params.dsId;
        logger.info('User: ' + req.user.email + '; query: ' + query);

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
            function(dataset, cb) {

                var url = dataset.url,
                    type = dataset.querytype;

                switch (type) {
                    case 'SPARQL':
                        sparql.query(url, query, format, cb); //cb(err,json)
                        break;
                    default:
                        cb({
                            message: "Dataset's type not supported"
                        });
                }
            }
        ], function(err, result) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }

            switch (format) {
                case 'json':
                    res.attachment('result.json');
                    res.end(result, 'UTF-8');
                    break;
                case 'csv':
                    result = JSON.parse(result);
                    var data = [];
                    var bindings = result.results.bindings;
                    for (i = 0; i < bindings.length; i++) {
                        var binding = bindings[i];
                        var tem = {};
                        for (var key in binding) {
                            tem[key] = binding[key].value;
                        }
                        data.push(tem);
                    }

                    var csvstr = '';
                    for (i = 0; i < data.length; i++) {
                        var datum = data[i];
                        if (i === 0) {
                            for (var thead in datum) {
                                csvstr += thead + ',';
                            }
                            csvstr += '\n';
                        }
                        for (var k in datum) {
                            csvstr += datum[k] + ',';
                        }
                        csvstr += '\n';
                    }

                    res.attachment('result.csv');
                    res.end(csvstr, 'UTF-8');
                    break;
                case 'tsv':
                    res.attachment('result.tsv');
                    res.end(result, 'UTF-8');
                    break;
                case 'xml':
                    res.attachment('result.xml');
                    res.end(result, 'UTF-8');
                    break;
                default:
                    logger.info('Result: ' + result);
                    try {
                        result = JSON.parse(result);
                    } catch (e) {
                        result = null;
                        req.flash('error', [e.message]);
                        logger.error(e);
                    }
                    /*
                    var data = [];
                    var bindings = result.results.bindings;
                    for (i = 0; i < bindings.length; i++) {
                        var binding = bindings[i];
                        var tem = {};
                        for (var key in binding) {
                            tem[key] = binding[key].value;
                        }
                        data.push(tem);
                    }
                    */
                    //res.send(result);
                    res.render('dsp', {
                        'result': result,
                        'info': req.flash('info'),
                        'error': req.flash('error')
                    });
            }
        });
    });

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

    /*
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
    */
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
    /*
    app.post('/auth/soton', function(req, res, next) {
        try {
            passport.authenticate('ldapauth', function(err, user, info) {
                if (err) {
                    req.flash('error', [err.message]);
                    return res.redirect('/auth/soton');
                }
                if (!user) {
                    req.flash('error', ['User not found']);
                    return res.redirect('/auth/soton');
                }
                req.logIn(user, function(err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect(req.get('referer'));
                });
            })(req, res, next);
        } catch (e) {
            logger.log(e);
        }
    });
*/
    //profile
    app.get("/profile", ensureLoggedIn('/login'), function(req, res) {
        User.findOne({
            email: req.user.email
        }, function(err, user) {
            var parameter = {
                'user': user
            };
            var errmsg = req.flash('error');
            if (err) {
                errmsg.push(err.message);
            } else {
                parameter.msg = user.msg;
                parameter.owned = user.owned;
                parameter.ownedVis = user.ownedVis;
                parameter.requested = user.requested;
            }

            parameter.error = errmsg;
            parameter.info = req.flash('info');
            parameter.scripts = ['/js/profile.jade.js'];
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
                    } else {
                        req.flash('info', ['Profile updated']);
                        return res.redirect(req.get('referer'));
                    }
                });
            });
        } else {
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
                    } else {
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
        if (typeof msgid === 'string')
            msgid = [msgid];

        User.findOne({
            email: req.user.email
        }, function(err, user) {
            if (err) {
                req.flash('error', [err.message]);
                return res.redirect(req.get('referer'));
            }
            for (var mid in msgid) {
                user.msg.general.remove(msgid[mid]);
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
            newpass = req.body.password;

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
        res.render('forgot-pass');
    });

    app.post('/profile/forgot-pass', function(req, res) {
        pass.forgotPass(req.body.email, 'http://' + req.host + ':3000/profile/reset-pass', function(err, response) {
            if (err) {
                req.flash('error', [err.message]);
                return req.redirect('/profile/forgot-pass');
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
