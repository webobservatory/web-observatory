/**
 * Created by xgfd on 03/06/2016.
 */


import mongo from 'sails-mongo'
import OpenIDConnect from 'openid-connect-wo'
import models from './models'

let oidcOpts = {
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
    defaults: {
        migrate: 'safe',
    },
    models
};

let oidc = OpenIDConnect.oidc(oidcOpts);

oidc.userInfo = function () {
    var self = this;
    return [
        self.check('openid', /profile|email/),
        self.use({policies: {loggedIn: false}, models: ['access', 'user']}),
        function (req, res) {
            req.model.access.findOne({token: req.parsedParams.access_token})
                .exec(function (err, access) {
                    if (!err && access) {
                        req.model.user.findOne({id: access.user}, function (err, user) {
                            if (req.check.scopes.indexOf('profile') != -1) {
                                user.sub = req.session.sub || req.session.user;
                                // delete user.id;
                                delete user.services;
                                res.json(user);
                            } else {
                                //console.log(user);
                                res.json({email: user.emails && user.emails[0].address, id: user.id});
                            }
                        });
                    } else {
                        self.errorHandle(res, null, 'unauthorized_client', 'Access token is not valid.');
                    }
                });
        }];
};

function hasATK(req) {
    let atk = req.query.access_token || req.body.access_token;
    return !!atk;
}
/**
 * Return a middleware that acts differently depending on the value of a predicate
 * @param {function(req, res, next)} left - Called when the predicate evaluates to false.
 * @param {function(req, res, next)} right - Called when the predicate
 * @param {function(req)} pred - A predicate function
 * @returns {function()} - A middleware that acts as left if pred is false, or as right if pred is true;
 */
function either(left, right, pred = hasATK) {
    return (req, res, next)=> {
        if (pred(req)) {
            right(req, res, next);
        } else {
            left(req, res, next);
        }
    }
};

function doNothing(_, __, next) {
    next();
}

function setUser(req, res, next) {
    let token = req.query.access_token || req.body.access_token;

    if (token) {
        req.model.access.findOne({token})
            .exec(function (err, access) {
                if (!err && access) {
                    req.user = access.user;
                    next();
                } else {
                    self.errorHandle(res, null, 'unauthorized_client', 'Invalid access token.');
                }
            });
    } else {
        req.user = null;
        next();
    }
}

oidc.checkAndSetUser = function () {
    let self = this;
    let scopes = arguments;
    return [
        either(doNothing, self.check(...scopes)),
        either(doNothing, self.use({policies: {loggedIn: false}, models: ['access']})),
        setUser
    ];
};

export default Object.create(oidc);
