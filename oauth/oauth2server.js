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

//utility function

function manageToken(user, client, scope, done) {

    RefreshTokenModel.remove({
        userId: user._id,
        clientId: client._id
    }, function(err) {
        if (err) return done(err);
    });

    AccessTokenModel.remove({
        userId: user._id,
        clientId: client._id
    }, function(err) {
        if (err) return done(err);
    });

    var tokenValue = crypto.randomBytes(32).toString('base64');

    var refreshTokenValue = crypto.randomBytes(32).toString('base64');

    var token = new AccessTokenModel({
        token: tokenValue,
        clientId: client._id,
        userId: user._id
    });

    var refreshToken = new RefreshTokenModel({
        token: refreshTokenValue,
        clientId: client._id,
        userId: user._id
    });

    refreshToken.save(function(err) {
        if (err) return done(err);
    });

    var info = {
        scope: '*'
    };

    token.save(function(err, token) {
        if (err) return done(err);

        done(null, tokenValue, refreshTokenValue, {
            'expires_in': config.development.oauth.tokenLife
        });
    });
}

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.

server.serializeClient(function(client, done) {
    return done(null, client._id);
});

server.deserializeClient(function(id, done) {

    ClientModel.findById(id, function(err, client) {

        if (err) return done(err);

        return done(null, client);
    });
});

//obtain an authorisation grant 
server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {

    var codeValue = crypto.randomBytes(8).toString('hex');

    var code = new AuthoriseCodeModel({
        token: codeValue,
        clientId: client._id,
        'redirectURI': redirectURI,
        userId: user._id,
        scope: ares.scope
    });

    code.save(function(err) {

        if (err) return done(err);

        done(null, codeValue);
    });
}));

//exchange user grant for an access token
server.exchange(oauth2orize.exchange.code(function(client, codeValue, redirectURI, done) {

    AuthoriseCodeModel.findOne({
        token: codeValue
    }, function(err, code) {

        if (err) return done(err);

        if (!code) return done(null, false);

        if (client._id.toString() !== code.clientId.toString()) return done(null, false);

        if (redirectURI !== code.redirectURI) return done(null, false);

        UserModel.findById(code.userId, function(err, user) {

            if (err) return done(err);

            if (!user) return done(null, false);

            AuthoriseCodeModel.remove({
                userId: user._id,
                clientId: client._id
            }, function(err) {
                if (err) return done(err);
            });

            manageToken(user, client, code.scope, done);

        });

    });
}));

// Exchange username & password for access token.
server.exchange(oauth2orize.exchange.password(function(client, email, password, scope, done) {

    UserModel.isValidUserPassword(email, password, function(err, user) {
        if (err) return done(err);

        if (!user) return done(null, false);

        manageToken(user, client, scope, done);

    });
}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {

    RefreshTokenModel.findOne({
        token: refreshToken
    }, function(err, token) {

        if (err) return done(err);

        if (!token) return done(null, false);

        if (client._id.toString() !== token.clientId.toString()) return done(null, false);

        UserModel.findById(token.userId, function(err, user) {

            if (err) return done(err);

            if (!user) return done(null, false);

            manageToken(user, client, scope, done);

        });
    });
}));

//authorise endpoint
exports.authorise = server.authorization(function(clientID, redirectURI, done) {
    ClientModel.findById(clientID, function(err, client) {
        if (err) return done(err);
        // It's recomended by the OAuth2 spec to check that
        // redirectURI provided by the client matches one registered with
        // the server.
        if (!client || redirectURI !== client.redirectURI) return done(null, false, null);
        done(null, client, redirectURI);
    });
});

// authorisation decision
exports.decision = server.decision();

// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], {
        session: false
    }),
    server.token(),
    server.errorHandler()
];
