/**
 * Created by xgfd on 03/06/2016.
 */

import express from 'express'
import oidc from './oidc'
import crypto from 'crypto'

let router = express.Router();

//Routes for testing only
//Client register form
router.get('/register', oidc.use('client'), function (req, res, next) {

    var mkId = function () {
        var key = crypto.createHash('md5').update(req.session.user + '-' + Math.random()).digest('hex');
        req.model.client.findOne({key: key}, function (err, client) {
            if (!err && !client) {
                var secret = crypto.createHash('md5').update(key + req.session.user + Math.random()).digest('hex');
                req.session.register_client = {};
                req.session.register_client.key = key;
                req.session.register_client.secret = secret;
                var head = '<head><title>Register Client</title></head>';
                var inputs = '';
                var fields = {
                    name: {
                        label: 'Client Name',
                        html: '<input type="text" id="name" name="name" placeholder="Client Name"/>'
                    },
                    redirect_uris: {
                        label: 'Redirect Uri',
                        html: '<input type="text" id="redirect_uris" name="redirect_uris" placeholder="Redirect Uri"/>'
                    },
                    key: {
                        label: 'Client Key',
                        html: '<span>' + key + '</span>'
                    },
                    secret: {
                        label: 'Client Secret',
                        html: '<span>' + secret + '</span>'
                    }
                };
                for (var i in fields) {
                    inputs += '<div><label for="' + i + '">' + fields[i].label + '</label> ' + fields[i].html + '</div>';
                }
                var error = req.session.error ? '<div>' + req.session.error + '</div>' : '';
                var body = '<body><h1>Register Client</h1><form method="POST">' + inputs + '<input type="submit"/></form>' + error;
                res.send('<html>' + head + body + '</html>');
            } else if (!err) {
                mkId();
            } else {
                next(err);
            }
        });
    };
    mkId();
});

//process client register
router.post('/register', oidc.use('client'), function (req, res, next) {
    delete req.session.error;
    req.body.key = req.session.register_client.key;
    req.body.secret = req.session.register_client.secret;
    req.body.user = req.session.user;
    req.body.redirect_uris = req.body.redirect_uris.split(/[, ]+/);
    req.model.client.create(req.body, function (err, client) {
        if (!err && client) {
            res.redirect('/client/' + client.id);
        } else {
            next(err);
        }
    });
});

router.get('/', oidc.use('client'), function (req, res, next) {
    var head = '<h1>Clients Page</h1><div><a href="/client/register"/>Register new client</a></div>';
    req.model.client.find({user: req.session.user}, function (err, clients) {
        var body = ["<ul>"];
        clients.forEach(function (client) {
            body.push('<li><a href="/client/' + client.id + '">' + client.name + '</li>');
        });
        body.push('</ul>');
        res.send(head + body.join(''));
    });
});

router.get('/:id', oidc.use('client'), function (req, res, next) {
    req.model.client.findOne({user: req.session.user, id: req.params.id}, function (err, client) {
        if (err) {
            next(err);
        } else if (client) {
            var html = '<h1>Client ' + client.name + ' Page</h1><div><a href="/client">Go back</a></div><ul><li>Key: ' + client.key + '</li><li>Secret: ' + client.secret + '</li><li>Redirect Uris: <ul>';
            client.redirect_uris.forEach(function (uri) {
                html += '<li>' + uri + '</li>';
            });
            html += '</ul></li></ul>';
            res.send(html);
        } else {
            res.send('<h1>No Client Found!</h1><div><a href="/client">Go back</a></div>');
        }
    });
});

export default router;
