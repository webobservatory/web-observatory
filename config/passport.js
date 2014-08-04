'use strict';
var mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    LDAPStrategy = require('passport-ldapauth').Strategy,
    RememberMeStrategy = require('passport-remember-me').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy,
    ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,
    BearerStrategy = require('passport-http-bearer').Strategy,
    crypto = require('crypto'),
    User = mongoose.model('User'),
    AccessToken = mongoose.model('AccessToken'),
    RefreshToken = mongoose.model('RefreshToken'),
    Client = mongoose.model('Client');


module.exports = function (passport, config) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findOne({
            _id: id
        }, function (err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    }, function (email, password, done) {
        User.isValidUserPassword(email, password, done);
    }));

    var ldapOpts = {
        server: {
            url: 'ldaps://nlbldap.soton.ac.uk',
            searchBase: 'ou=User,dc=soton,dc=ac,dc=uk',
            adminDn: '',
            adminPassword: '',
            verbose: true,
            searchFilter: '(cn={{username}})',
            searchAttributes: ['displayName', 'mail', 'sn', 'givenName', 'cn']
        }
        //usernameField: Field name where the username is found, defaults to username
        //passwordField: Field name where the password is found, defaults to password
    };


    passport.use(new LDAPStrategy(ldapOpts, function (user, done) {
        User.findOrCreateSotonUser(user, done);
    }));

    function consumeRememberMeToken(token, done) {
        User.findOne({
            rememberme: token
        }, function (err, user) {
            if (err) {
                return done(err, null);
            }
            if (!user) {
                return done(null, false, {
                    message: 'No remembered user found'
                });
            }

            user.rememberme = null;
            user.save(done);
        });
    }

    function issueRememberMeToken(user, done) {
        crypto.randomBytes(32, function (ex, buf) {
            var token = buf.toString('hex');
            user.rememberme = token;
            user.save(function (err) {
                if (err) {
                    return done(err);
                }
                done(null, token);
            });
        });
    }
    
    passport.use(new RememberMeStrategy(consumeRememberMeToken, issueRememberMeToken));

    /*
     passport.use(new FacebookStrategy({
     clientID: config.facebook.clientID,
     clientSecret: config.facebook.clientSecret,
     callbackURL: config.facebook.callbackURL,
     }, function(accessToken, refreshToken, profile, done) {
     User.findOrCreateFaceBookUser(profile, done);
     }));
     */


    //OAuth2
    passport.use(new BasicStrategy(
        function (username, password, done) {
            Client.findOne({
                _id: username
            }, function (err, client) {
                if (err) {
                    return done(err);
                }
                if (!client) {
                    return done(null, false);
                }
                if (client.clientSecret !== password) {
                    return done(null, false);
                }

                return done(null, client);
            });
        }
    ));

    passport.use(new ClientPasswordStrategy(
        function (clientId, clientSecret, done) {
            Client.findOne({
                _id: clientId
            }, function (err, client) {
                if (err) {
                    return done(err);
                }
                if (!client) {
                    return done(null, false);
                }
                if (client.clientSecret !== clientSecret) {
                    return done(null, false);
                }

                return done(null, client);
            });
        }
    ));

    passport.use(new BearerStrategy(
        function (accessToken, done) {
            AccessToken.findOne({
                token: accessToken
            }, function (err, token) {
                if (err) {
                    return done(err);
                }
                if (!token) {
                    return done(null, false);
                }

                if (Math.round((Date.now() - token.created) / 1000) > config.oauth.tokenLife) {

                    AccessToken.remove({
                        token: accessToken
                    }, function (err) {
                        if (err) {
                            return done(err);
                        }
                    });

                    return done(null, false, {
                        message: 'Token expired'
                    });
                }

                User.findById(token.userId, function (err, user) {

                    if (err) {
                        return done(err);
                    }

                    if (!user) {
                        return done(null, false, {
                            message: 'Unknown user'
                        });
                    }

                    var info = {
                        scope: '*'
                    };

                    done(null, user, info);
                });
            });
        }
    ));
};

