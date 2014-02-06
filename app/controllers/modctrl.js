var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    EntrySchema = mongoose.model('Entry'),
    async = require('async'),
    crypto = require('crypto'),
    logger = require('../util/logger');

module.exports.visibleEtry = function(email, typ, cb) {
    EntrySchema.find({
        opVis: true,
        type: typ
    }, function(err, entries) {
        if (err) {
            logger.error(err);
            return cb(err, []);
        }

        email = email || 'match_nothing';

        User.findOne({
            'email': email
        }).populate('own').populate('readable').exec(function(err, user) {
            if (err) {
                logger.error(err);
                return cb(err, entries);
            }

            if (!user) {
                return cb(err, entries);
            }

            var etry_ids = entries.map(function(e) {
                return e._id.toString();
            });

            var own = user.own;

            for (i = 0; i < own.length; i++) {
                var index = etry_ids.indexOf(own[i]._id.toString());
                if (index === -1 && own[i].type === typ) {
                    own[i].opAcc = true;
                    entries.push(own[i]);
                }

                if (index !== -1) {
                    entries[index].opAcc = true;
                }
            }

            var readable = user.readable;

            for (i = 0; i < readable.length; i++) {
                var index = etry_ids.indexOf(readable[i]._id.toString());
                if (index === -1 && readable[i].type === typ) {
                    readable[i].opAcc = true;
                    entries.push(readable[i]);
                }
                if (index !== -1) {
                    entries[index].opAcc = true;
                }
            }

            cb(null, entries);
        });
    });
};

module.exports.addEtry = function(email, etry, cb) {

    EntrySchema.findOne({
        $or: [{
                name: etry.name
            }, {
                url: etry.url
            }
        ]
    }, function(err, entry) {
        if (err) {
            logger.error(err);
            return cb(err);
        }
        if (entry) {
            logger.warn('Existing entry; user: ' + email + '; entry: ' + (entry.url || entry.name) + ';');
            return cb({
                message: 'Existing entry name or url'
            });
        }

        if (etry.auth && etry.auth.encpwd) {
            var key = etry.url,
                enc_alg = 'aes256',
                pwd = etry.auth.encpwd;

            var cipher = crypto.createCipher(enc_alg, key);
            var encrypted = cipher.update(pwd, 'utf8', 'hex') + cipher.final('hex');
            etry.auth.encpwd = encrypted;
        }

        EntrySchema.create(etry, function(err, entry) {
            if (err) {
                logger.error(err);
                return cb({
                    message: 'Failed to create entry ' + (etry.name || etry.url)
                });
            }
            User.addEtry(email, entry._id, function(err) {
                if (err) {
                    logger.error(err);
                    err = {
                        message: 'Failed to create entry ' + (etry.name || etry.url)
                    };
                }
                cb(err);
            });
        });
    });
};

module.exports.editEtry = function(etry_id, update, cb) {

    EntrySchema.findById(etry_id, function(err, entry) {
        if (err) {
            logger.error(err);
            return cb(err);
        }
        if (!entry) {
            logger.warn('Nonexisting entry;' + ' entry: ' + etry_id + ';');
            return cb({
                message: 'Nonexisting entry'
            });
        }

        for (var key in update) {
            entry[key] = update[key];
        }
        entry.save(function(err) {
            if (err) {
                logger.error(err);
                return cb(err);
            }
            cb(err);
        });
    });
};

//register access requests
module.exports.reqAccToEtry = function(etryIds, issuer, render) {

    async.map(etryIds, function(eid, cb) {
        User.findOne({
            'own': eid
        }, function(err, user) {
            if (err) {
                logger.error(err);
                return cb({
                    message: 'Internal error'
                });
            }
            if (!user)
                return cb({
                    message: 'No publisher found for requested dataset' + eid
                });

            user.pendingreq.push({
                sender: issuer,
                entry: eid
            });
            user.save(function(err) {
                cb(err, eid);
            });
        });
    }, function(err, sentEIds) {

        if (err) return render(err);

        var update = {
            $addToSet: {
                accreq: {
                    $each: sentEIds
                }
            }
        };

        User.update({
            email: issuer
        }, update, render);
    });
};

//aprove request access
module.exports.aprvAccToEtry = function(deny, reqIds, owner, render) {

    User.findOne({
        email: owner
    }).populate('pendingreq.entry').exec(function(err, user) {
        if (err) return render(err);

        async.map(reqIds, function(rid, cb) {
            var req = user.pendingreq.id(rid);
            console.log(req);
            if (!req) return cb({
                    message: 'Unknown request'
                });
            if (deny)
                denyAccess(req, function(err) {
                    req.remove();
                    cb(err, req);
                });
            else
                grantAccess(req, function(err) {
                    req.remove();
                    cb(err, req);
                });
        }, function(err, reqs) {
            if (err) return render(err);
            user.save(render);
        });
    });
};

function grantAccess(request, done) {
    var entry = request.entry;
    var query = {
        email: request.sender,
        readable: {
            $ne: entry._id
        }
    }; //grant access only if the user cannot access to the given entry

    var update = {
        $push: {
            readable: entry,
            'msg': {
                content: 'Your request for accessing ' + entry.name + ' has been approved',
                read: false
            }
        },
        $pull: {
            accreq: entry._id
        }
    };

    User.update(query, update, function(err, user) {
        logger.info('Request approved; user: ' + user.email + '; entry: ' + entry.url + ';');
        done(err, request);
    });
}

function denyAccess(request, done) {
    var entry = request.entry;
    var query = {
        email: request.sender,
    };

    var update = {
        $push: {
            'msg': {
                content: 'Your request for accessing ' + entry.name + ' has been denied',
                read: false
            }
        }
    };

    User.update(query, update, function(err, user) {
        logger.info('Request denied; user: ' + user.email + '; entry: ' + entry.url + ';');
        done(err, request);
    });
}
