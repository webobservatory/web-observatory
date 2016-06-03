/**
 * Created by xgfd on 03/06/2016.
 */


import mongo from 'sails-mongo'
import OpenIDConnect from 'openid-connect'
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
    models
};

let oidc = OpenIDConnect.oidc(oidcOpts);

oidc.userInfo = function () {
    var self = this;
    return [
        self.check('openid', /profile|email/),
        self.use({policies: {loggedIn: false}, models: ['access', 'users']}),
        function (req, res, next) {
            req.model.access.findOne({token: req.parsedParams.access_token})
                .exec(function (err, access) {
                    if (!err && access) {
                        req.model.users.findOne({id: access.user}, function (err, user) {
                            if (req.check.scopes.indexOf('profile') != -1) {
                                user.sub = req.session.sub || req.session.user;
                                delete user.id;
                                delete user.services
                                res.json(user);
                            } else {
                                //console.log(user);
                                res.json({email: user.emails && user.emails[0].address});
                            }
                        });
                    } else {
                        self.errorHandle(res, null, 'unauthorized_client', 'Access token is not valid.');
                    }
                });
        }];
};

export default Object.create(oidc);
