'use strict';
var mongoose = require('mongoose'),
    hash = require('../util/hash'),
    logger = require('../util/logger'),
    Schema = mongoose.Schema,
    EntrySchema = require('./entry').schema;

var UserSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    username: {
        type: String,
        unique: true
    },
    email: String,
    org: String,
    salt: String,
    hash: String,
    facebook: {
        id: String,
        email: String,
        name: String
    },
    soton: {
        id: String,
        email: String,
        name: String
    },
    twitter: {
        id: String,
        email: String,
        name: String
    },
    //oauth clients
    clients: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Client'
        }
    ],
    //password reset
    reset: {
        token: String,
        time_stamp: Date
    },
    rememberme: String,
    //datasets relevant
    visible: [ //list of datasets that are visible to this user
        {
            type: Schema.Types.ObjectId,
            ref: 'Entry'
        }
    ],
    readable: [ //list of datasets that the current user can query
        {
            type: Schema.Types.ObjectId,
            ref: 'Entry'
        }
    ],
    own: [ //list of datasets that are published by the current user
        {
            type: Schema.Types.ObjectId,
            ref: 'Entry'
        }
    ],
    accreq: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Entry'
        }
    ], //access requests sent to these datasets
    pendingreq: [
        { //received requests
            sender: String,
            entry: {
                type: Schema.Types.ObjectId,
                ref: 'Entry'
            },
            read: Boolean
        }
    ],
    msg: [
        { //general messages
            sender: String,
            content: String,
            read: Boolean
        }
    ],

    timestamp: {
        type: Date,
        default: Date.now
    }
});

//user control
UserSchema.statics.signup = function (firstname, lastname, organisation, email, password, done) {
    hash(password, function (err, salt, hash) {
        //if (err) throw err;
        if (err) {
            return done(err);
        }
        User.create({
            firstName: firstname,
            lastName: lastname,
            org: organisation,
            email: email,
            salt: salt,
            hash: hash
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            done(null, user);
        });
    });
};

UserSchema.statics.updateProfile = function (user, nps, fn, ln, org, done) {
    if (nps) {
        hash(nps, function (err, salt, hash) {
            if (fn) {
                user.firstName = fn;
            }
            if (ln) {
                user.lastName = ln;
            }
            if (org) {
                user.org = org;
            }
            user.salt = salt;
            user.hash = hash;
            user.save(done);
        });
    } else {
        if (fn) {
            user.firstName = fn;
        }
        if (ln) {
            user.lastName = ln;
        }
        if (org) {
            user.org = org;
        }
        user.save(done);
    }
};

UserSchema.statics.isValidUserPassword = function (email, password, done) {
    User.findOne({
        email: email
    }, function (err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false, {
                message: 'Incorrect email.'
            });
        }

        if (!user.salt || !user.hash) {
            return done(null, false, {
                message: 'Password not set. Please reset your password first.'
            });
        }

        hash(password, user.salt, function (err, hashBuf) {
            if (err) {
                return done(err);
            }

            if (hashBuf.toString() === user.hash) {
                return done(null, user);
            }

            done(null, false, {
                message: 'Incorrect password'
            });
        });
    });
};

UserSchema.statics.findOrCreateFaceBookUser = function (profile, done) {
    User.findOne({
        'facebook.id': profile.id
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (user) {
            done(null, user);
        } else {
            User.create({
                email: profile.emails[0].value,
                facebook: {
                    id: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName
                }
            }, function (err, user) {
                if (err) {
                    return done(err);
                }
                done(null, user);
            });
        }
    });
};

UserSchema.statics.findOrCreateSotonUser = function (profile, done) {
    User.findOne({
        'soton.id': profile.cn
    }, function (err, user) {
        if (err) {
            return done(err);
        }
        if (user) {
            done(null, user);
        } else {
            User.create({
                firstName: profile.givenName,
                lastName: profile.sn,
                email: profile.mail,
                username: profile.displayName,
                soton: {
                    id: profile.cn,
                    email: profile.mail,
                    name: profile.displayName
                }
            }, function (err, user) {
                if (err) {
                    return done(err);
                }
                done(null, user);
            });
        }
    });
};

//dataset access control


UserSchema.statics.addOwn = function (publisher, etry_id, done) {
    var query, update;
    query = {
        email: publisher,
        'own': {
            $ne: etry_id
        }
    };

    update = {
        $push: {
            own: etry_id
        }
    };

    this.update(query, update, function (err, count) {
        logger.info('Entry add; user: ' + publisher + '; dataset: ' + etry_id + ';');
        done(err, count);
    });
};

UserSchema.statics.addEtry = function (eml, entry_id, cb) {
    this.findOne({
        email: eml
    }, function (err, user) {
        if (err || !user) {
            err = err || {
                message: 'User ' + eml + ' does not exist.'
            };
            logger.error(err);
            return cb(err);
        }
        user.own.push(entry_id);
        user.save(cb);
    });
};

UserSchema.statics.hasAccessTo = function (email, ds_id, done) {
    var query;

    query = {
        email: email,
        readable: ds_id
    };

    this.findOne(query, function (err, user) {

        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false, {
                message: 'Access denied'
            });
        }
        done(null, user);
    });
};

var User = mongoose.model("User", UserSchema);
module.exports = User;
