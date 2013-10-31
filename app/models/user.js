var mongoose = require('mongoose');
var hash = require('../util/hash');


UserSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
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
    access: [{
            id: String,
            title: String
        }
    ]

});

//user control
UserSchema.statics.signup = function(email, password, done) {
    var User = this;
    hash(password, function(err, salt, hash) {
        if (err) throw err;
        // if (err) return done(err);
        User.create({
            email: email,
            salt: salt,
            hash: hash
        }, function(err, user) {
            if (err) throw err;
            // if (err) return done(err);
            done(null, user);
        });
    });
};


UserSchema.statics.isValidUserPassword = function(email, password, done) {
    this.findOne({
        email: email
    }, function(err, user) {
        // if(err) throw err;
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



UserSchema.statics.findOrCreateSotonUser = function(req, profile, done) {
    var User = this;
    User.findOne({
        'soton.id': profile.cn
    }, function(err, user) {
        if (err) throw err;
        // if (err) return done(err);
        if (user) {
            //console.log('found user: '+ profile.cn);
            done(null, user);
        } else {
            console.log('create user: ' + profile.cn);
            console.log(JSON.stringify(req.user));
            req.user.email = profile.mail;
            User.create({
                email: profile.mail,
                soton: {
                    id: profile.cn,
                    email: profile.mail,
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

//dataset access control
UserSchema.statics.grantAccess = function(email, dataset, done) {
    var User = this;
    var query = {
        email: email,
        access: {
            $ne: {
                id: dataset
            }
        }
    }; //grant access only if the user doesn't access to the given dataset

    var update = {
        $push: {
            access: {
                id: dataset
            }
        }
    };

    User.update(query, update, function(err, user) {
        if (err) throw err;

        if (!user) {
            console.log('Access already grantted');
            done(null, user);
        } else {
            console.log('Access grantted');
            done(null, user);
        }
    });
};


UserSchema.statics.hasAccessTo = function(email, dataset, done) {

    var User = this;
    var query = {
        email: email,
        access: {
            id: dataset
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

UserSchema.statics.listDatasets = function(email, render) {

    var query = {
        email: email
    };

    this.findOne(query, function(err, user) {
        render(err, user);
    });
};

var User = mongoose.model("User", UserSchema);
module.exports = User;
