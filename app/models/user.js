var mongoose = require('mongoose');
var hash = require('../util/hash');
var logger = require('../util/logger');
var Schema = mongoose.Schema;
var EntrySchema = mongoose.model('Entry').schema;

UserSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
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
    //password reset
    reset: {
        token: String,
        time_stamp: Date
    },
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
    accreq: [{
            type: Schema.Types.ObjectId,
            ref: 'Entry'
        }
    ], //requested access to these datasets
    msg: {
        requests: [{ //received requests
                sender: String,
                dataset: [{
                        type: Schema.Types.ObjectId,
                        ref: 'Entry'
                    }
                ],
                read: Boolean
            }
        ],
        general: [{ //general messages
                sender: String,
                content: String,
                read: Boolean
            }
        ]
    }
});

//user control
UserSchema.statics.signup = function(firstname, lastname, organisation, email, password, done) {
    var User = this;
    hash(password, function(err, salt, hash) {
        //if (err) throw err;
        if (err)
            return done(err);
        User.create({
            firstName: firstname,
            lastName: lastname,
            org: organisation,
            email: email,
            salt: salt,
            hash: hash
        }, function(err, user) {
            //if (err) throw err;
            if (err)
                return done(err);
            done(null, user);
        });
    });
};

UserSchema.statics.updateProfile = function(user, nps, fn, ln, org, done) {
    if (nps) {
        hash(nps, function(err, salt, hash) {
            if (fn)
                user.firstName = fn;
            if (ln)
                user.lastName = ln;
            if (org)
                user.org = org;
            user.salt = salt;
            user.hash = hash;
            user.save(done);
        });
    } else {
        if (fn)
            user.firstName = fn;
        if (ln)
            user.lastName = ln;
        if (org)
            user.org = org;
        user.save(done);
    }
};

UserSchema.statics.isValidUserPassword = function(email, password, done) {
    this.findOne({
        email: email
    }, function(err, user) {
        if (err) return done(err);
        if (!user) return done(null, false, {
                message: 'Incorrect email.'
            });

        if (!user.salt)
            return done(null, false, {
                message: 'Password not set. Please reset your password first.'
            });

        hash(password, user.salt, function(err, hash) {
            if (err) return done(err);
            if (hash == user.hash) return done(null, user);
            done(null, false, {
                message: 'Incorrect password'
            });
        });
    });
};

UserSchema.statics.findOrCreateFaceBookUser = function(profile, done) {
    var User = this;
    User.findOne({
        'facebook.id': profile.id
    }, function(err, user) {
        if (err) throw err;
        // if (err) return done(err);
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
            }, function(err, user) {
                if (err) throw err;
                // if (err) return done(err);
                done(null, user);
            });
        }
    });
};

UserSchema.statics.findOrCreateSotonUser = function(profile, done) {
    var User = this;
    User.findOne({
        'soton.id': profile.cn
    }, function(err, user) {
        if (err)
            return done(err);
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
            }, function(err, user) {
                if (err)
                    return done(err);
                done(null, user);
            });
        }
    });
};

//dataset access control

UserSchema.statics.accCtrl = function(deny, request, done) {
    if (deny)
        User.denyAccess(request, done);
    else
        User.grantAccess(request, done);
};

UserSchema.statics.grantAccess = function(request, done) {
    var User = this;
    var dataset = request.dataset[0];
    var query = {
        email: request.sender,
        readable: {
            $ne: dataset._id
        }
    }; //grant access only if the user cannot access to the given dataset

    var update = {
        $push: {
            readable: dataset._id,
            'msg.general': {
                content: 'Your request for accessing ' + dataset.title + ' has been approved',
                read: false
            }
        },
        $pull: {
            accreq: dataset._id
        }
    };

    User.update(query, update, function(err, user) {
        logger.info('Request approved; user: ' + user.email + '; dataset: ' + dataset.url + ';');
        done(err, request);
    });
};

UserSchema.statics.denyAccess = function(request, done) {
    var User = this;
    var dataset = request.dataset[0];
    var query = {
        email: request.sender,
    };

    var update = {
        $push: {
            'msg.general': {
                content: 'Your request for accessing ' + dataset.title + ' has been denied',
                read: false
            }
        }
    };

    User.update(query, update, function(err, user) {
        logger.info('Request denied; user: ' + user.email + '; dataset: ' + dataset.url + ';');
        done(err, request);
    });
};

UserSchema.statics.rmReq = function(umail, reqs, done) {
    var update = {
        $pullAll: {
            'msg.requests': reqs
        }
    };
    User.update({
        email: umail
    }, update, function(err, user) {
        logger.info('Requests removed; user: ' + user.email + ';');
        done(err, user);
    });
};

UserSchema.statics.addOwn = function(publisher, etry_id, done) {
    var query = {
        email: publisher,
        'own': {
            $ne: etry_id
        }
    };

    var update = {
        $push: {
            own: etry_id
        }
    };

    this.update(query, update, function(err, count) {
        logger.info('Entry add; user: ' + publisher + '; dataset: ' + etry_id + ';');
        done(err, count);
    });
};

UserSchema.statics.addEtry = function(eml, entry_id, cb) {
    this.findOne({
        email: eml
    }, function(err, user) {
        if (err || !user) {
            err = err || {
                message: 'User ' + eml + ' does not exist.'
            };
            logger.error(err);
            return cb(err);
        }
        user.ownEtry.push(entry_id);
        user.save(cb);
    });
};

UserSchema.statics.hasAccessTo = function(email, ds_id, done) {
    var User = this;
    var query = {
        email: email,
        readable: ds_id
    };

    this.findOne(query, function(err, user) {

        if (err) return done(err);

        if (!user) return done(null, false, {
                message: 'Access denied'
            });
        done(null, user);
    });
};

//message handling
UserSchema.statics.addReq = function(sender, dataset, done) {
    var query = {
        email: dataset.publisher
    };
    var update = {
        $addToSet: {
            'msg.requests': {
                'sender': sender,
                'dataset': [dataset],
                read: false
            }
        }
    };

    this.update(query, update, function(err, user) {
        done(err, dataset);
    });
};

var User = mongoose.model("User", UserSchema);
module.exports = User;
