'use strict';
var oauth2orize = require('oauth2orize'),
    passport = require('passport'),
    crypto = require('crypto'),
    config = require('../config/config'),
    mongoose = require('mongoose'),
    UserModel = mongoose.model('User'),
    AccessTokenModel = mongoose.model('AccessToken'),
    RefreshTokenModel = mongoose.model('RefreshToken'),
    AuthoriseCodeModel = mongoose.model('AuthoriseCode'),
    ClientModel = mongoose.model('Client');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

//utility function
function manageToken(user, client, scope, refreshTokenIssue, done) {

    var accessTokenValue, refreshTokenValue, accessToken, refreshToken, info;

    //generate an access token
    AccessTokenModel.remove({
        userId: user._id,
        clientId: client._id
    }, function (err) {
        if (err) {
            return done(err);
        }
    });

    accessTokenValue = crypto.randomBytes(32).toString('base64');

    accessToken = new AccessTokenModel({
        token: accessTokenValue,
        clientId: client._id,
        userId: user._id
    });

    if (refreshTokenIssue) {//whether to issue a refresh token

        //generate a refresh token
        RefreshTokenModel.remove({
            userId: user._id,
            clientId: client._id
        }, function (err) {
            if (err) {
                return done(err);
            }
        });

        refreshTokenValue = crypto.randomBytes(32).toString('base64');

        refreshToken = new RefreshTokenModel({
            token: refreshTokenValue,
            clientId: client._id,
            userId: user._id
        });

        refreshToken.save(function (err) {
            if (err) {
                return done(err);
            }
        });
    }

    info = {
        scope: scope || '*'
    };

    accessToken.save(function (err, token) {
        if (err) {
            return done(err);
        }

        if (refreshTokenIssue) {
            done(null, accessTokenValue, refreshTokenValue, {
                'expires_in': config.development.oauth.tokenLife,
                info: info
            });
        } else {
            done(null, accessTokenValue, {
                'expires_in': config.development.oauth.tokenLife,
                info: info
            });
        }
    });
}

// Register serialialization and deserialization functions.
server.serializeClient(function (client, done) {
    return done(null, client._id);
});

server.deserializeClient(function (id, done) {

    ClientModel.findById(id, function (err, client) {

        if (err) {
            return done(err);
        }

        return done(null, client);
    });
});

//Authorization Code Grant
server.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {

    var codeValue, code;
    codeValue = crypto.randomBytes(8).toString('hex');

    code = new AuthoriseCodeModel({
        token: codeValue,
        clientId: client._id,
        'redirectURI': redirectURI,
        userId: user._id,
        scope: ares.scope
    });

    code.save(function (err) {

        if (err) {
            return done(err);
        }

        done(null, codeValue);
    });
}));

//Implicit Grant
server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
    manageToken(user, client, ares.scope, false, done);// a refresh token MUST NOT be issued for implicit grant
}));

//Resource Owner Password Credentials
// Exchange username & password for access token.
server.exchange(oauth2orize.exchange.password(function (client, email, password, scope, done) {

    UserModel.isValidUserPassword(email, password, function (err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false);
        }

        manageToken(user, client, scope, true, done);

    });
}));

//exchange user grant code for an access token
server.exchange(oauth2orize.exchange.code(function (client, codeValue, redirectURI, done) {

    AuthoriseCodeModel.findOne({
        token: codeValue
    }, function (err, code) {

        if (err) {
            return done(err);
        }

        if (!code) {
            return done(null, false);
        }

        if (client._id.toString() !== code.clientId.toString()) {
            return done(null, false);
        }

        if (redirectURI !== code.redirectURI) {
            return done(null, false);
        }

        UserModel.findById(code.userId, function (err, user) {

            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            AuthoriseCodeModel.remove({
                userId: user._id,
                clientId: client._id
            }, function (err) {
                if (err) {
                    return done(err);
                }
            });

            manageToken(user, client, code.scope, true, done);

        });

    });
}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {

    RefreshTokenModel.findOne({
        token: refreshToken
    }, function (err, token) {

        if (err) {
            return done(err);
        }

        if (!token) {
            return done(null, false);
        }

        if (client._id.toString() !== token.clientId.toString()) {
            return done(null, false);
        }

        UserModel.findById(token.userId, function (err, user) {

            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            manageToken(user, client, scope, true, done);

        });
    });
}));

//authorisation endpoint
exports.authorise = server.authorization(function (clientID, redirectURI, done) {
    ClientModel.findById(clientID, function (err, client) {
        if (err) {
            return done(err);
        }
        // It's recomended by the OAuth2 spec to check that
        // redirectURI provided by the client matches one registered with
        // the server.
        if (!client) {
            return done({message: 'Client of the given ID not found'}, false, null);
        }
        if (client.redirectURI && redirectURI && redirectURI !== client.redirectURI) {
            return done({message: 'Redirect URL not valid'}, false, null);
        }
        done(null, client, redirectURI);
    });
});

// authorisation decision endpoint
exports.decision = server.decision();

// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], {
        session: false
    }),
    server.token(),
    server.errorHandler()
];
