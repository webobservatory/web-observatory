/**
 * Created by xgfd on 02/06/2016.
 */

import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import crypto from 'crypto'

let mongo = Npm.require('sails-mongo');
import OpenIDConnect from 'openid-connect'
import models from './models'

let options = {
    login_url: '/sign-in',
    consent_url: '/oauth/decision',
    iss: Meteor.absoluteUrl(),
    scopes: {
        meta: 'Access to the metadata of your apps and datasets',
        content: 'Access to  your apps and datasets'
    },
    adapters: {
        mongo
    },
    connections: {
        def: {
            adapter: 'mongo',
            url: process.env.MONGO_URL || 'mongodb://127.0.0.1:3001/meteor'
        }
    },
    models
};

let oidc = OpenIDConnect.oidc(options);
let app = express();
WebApp.connectHandlers.use(Meteor.bindEnvironment(app));

app.use(session({secret: 'webobservatory', resave: false, saveUninitialized: false}));
app.use(Meteor.bindEnvironment((req, res, next)=> {
    if (req.query) {
        req.session.user = req.query.user;
        delete req.query.user;
    }
    next();
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/api/echo', (req, res)=> {
    let q = JSON.stringify(req.query);
    res.end(`ok. ${q}`);
});

app.get('/oauth/authorise', oidc.auth());
app.post('/oauth/token', oidc.token());
app.post('/oauth/decision', oidc.consent());
app.get('/api/userInfo', oidc.userInfo());

//user consent form
app.get('/oauth/decision', function (req, res, next) {
    var head = '<head><title>Consent</title></head>';
    var lis = [];
    for (var i in req.session.scopes) {
        lis.push('<li><b>' + i + '</b>: ' + req.session.scopes[i].explain + '</li>');
    }
    var ul = '<ul>' + lis.join('') + '</ul>';
    var error = req.session.error ? '<div>' + req.session.error + '</div>' : '';
    var body = '<body><h1>Consent</h1><form method="POST">' + ul + '<input type="submit" name="accept" value="Accept"/><input type="submit" name="cancel" value="Cancel"/></form>' + error;
    res.send('<html>' + head + body + '</html>');
});

//Client register form
app.get('/client/register', oidc.use('client'), function (req, res, next) {

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
app.post('/client/register', oidc.use('client'), function (req, res, next) {
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

app.get('/client', oidc.use('client'), function (req, res, next) {
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

app.get('/client/:id', oidc.use('client'), function (req, res, next) {
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

