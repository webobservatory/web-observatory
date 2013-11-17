var mongoose = require('mongoose');
var hash = require('../util/hash');
var DatasetSchema = mongoose.model('Dataset').schema;

UserSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    salt: String,
    hash: String,
    reset: {
        token: String,
        time_stamp: Date
    },
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
    visible: [ //list of datasets that are visible to this user
        DatasetSchema
    ],
    readable: [ //list of datasets that the current user can query
        DatasetSchema
    ],
    owned: [ //list of datasets that are published by the current user
        DatasetSchema
    ],
    ownedVis: [DatasetSchema],
    requested: [DatasetSchema],
    msg: {
        requests: [{
                sender: String,
                dataset: [DatasetSchema],
                read: Boolean
            }
        ],
        general: [{
                sender: String,
                content: String,
                read: Boolean
            }
        ]
    }
});

//user control
UserSchema.statics.signup = function(email, password, done) {
    var User = this;
    hash(password, function(err, salt, hash) {
        //if (err) throw err;
        if (err)
            return done(err);
        User.create({
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

UserSchema.statics.updateProfile = function(user, nps, username, done) {
    if (nps) {
        hash(nps, function(err, salt, hash) {
            if (username)
                user.username = username;
            user.salt = salt;
            user.hash = hash;
            user.save(done);
        });
    } else {
        if (username) {
            user.username = username;
            user.save(done);
        } else
            done(null, user);
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
    console.log('grant');
    var User = this;
    var dataset = request.dataset[0];
    var query = {
        email: request.sender,
        readable: {
            $ne: dataset
        }
    }; //grant access only if the user cannot access to the given dataset

    var update = {
        $push: {
            readable: dataset,
            'msg.general': {
                content: 'Your request for accessing ' + request.dataset[0].title + ' has been approved',
                read: false
            }
        },
        $pull: {
            requested: dataset
        }
    };

    User.update(query, update, function(err, user) {
        done(err, request);
    });
};

UserSchema.statics.denyAccess = function(request, done) {
    console.log('deny');
    var User = this;
    var query = {
        email: request.sender,
    };

    var update = {
        $push: {
            'msg.general': {
                content: 'Your request for accessing ' + request.dataset[0].title + ' has been denied',
                read: false
            }
        }
    };

    User.update(query, update, function(err, user) {
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
        done(err, user);
    });
};

UserSchema.statics.addOwn = function(publisher, dataset, done) {
    var query = {
        email: publisher,
        'owned.url': {
            $ne: dataset.url
        }
    };

    var update = {
        $push: {
            owned: dataset
        }
    };

    this.update(query, update, function(err, count) {
        done(err, count);
    });
};

UserSchema.statics.addOwnVis = function(publisher, vis, done) {

    var query = {
        email: publisher,
        'ownedVis.url': {
            $ne: vis.url
        }
    };

    var update = {
        $push: {
            ownedVis: vis
        }
    };

    this.update(query, update, function(err, count) {
        done(err, count);
    });
};

UserSchema.statics.hasAccessTo = function(email, dataset_url, done) {

    var User = this;
    var query = {
        email: email,
        readable: {
            url: dataset_url
        }
    };

    this.findOne(query, function(err, user) {

        if (err) return done(err);

        if (!user) return done(null, false, {
                message: 'Access is not allowed'
            });

        done(null, user);
    });

};

UserSchema.statics.listDatasets = function(email, cb) {

    var query = {
        email: email
    };

    this.findOne(query, function(err, user) {
        if (err)
            return cb(err);
        cb(err, user.visible, user.readable, user.owned);
    });
};
UserSchema.statics.listVisualisations = function(email, cb) {

    var query = {
        email: email
    };

    this.findOne(query, function(err, user) {
        if (err)
            return cb(err);
        cb(err, user.ownedVis);
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
