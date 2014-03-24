var mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    LDAPStrategy = require('passport-ldapauth').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    User = mongoose.model('User');


module.exports = function(passport, config) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findOne({
            _id: id
        }, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    }, function(email, password, done) {
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
        },
        //usernameField: Field name where the username is found, defaults to username
        //passwordField: Field name where the password is found, defaults to password
    };


    passport.use(new LDAPStrategy(ldapOpts, function(user, done) {
        User.findOrCreateSotonUser(user, done);
    }));

    passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL,
    }, function(accessToken, refreshToken, profile, done) {
        User.findOrCreateFaceBookUser(profile, done);
    }));
    
};
