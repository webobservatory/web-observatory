var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    EntrySchema = mongoose.model('Entry'),
    async = require('async'),
    crypto = require('crypto'),
    logger = require('../../app/util/logger');

module.exports.visibleEtry = function (email, typ, cb) {
    EntrySchema.find({
        opVis: true,
        type: typ
    }, function (err, entries) {
        if (err) {
            logger.error(err);
            return cb(err, []);
        }

        email = email || 'match_nothing';

        User.findOne({
            'email': email
        }).populate('own').populate('readable').exec(function (err, user) {
            if (err) {
                logger.error(err);
                return cb(err, entries);
            }

            if (!user) {
                return cb(err, entries);
            }

            var etry_ids = entries.map(function (e) {
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

module.exports.addEtry = function (email, etry, cb) {

    EntrySchema.findOne({
        $or: [
            {
                name: etry.name
            },
            {
                url: etry.url
            }
        ]
    }, function (err, entry) {
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

        EntrySchema.create(etry, function (err, entry) {
            if (err) {
                logger.error(err);
                return cb({
                    message: 'Failed to create entry ' + (etry.name || etry.url)
                });
            }
            User.addEtry(email, entry._id, function (err) {
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

module.exports.editEtry = function (etry_id, update, cb) {

    EntrySchema.findById(etry_id, function (err, entry) {
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
        entry.save(function (err) {
            if (err) {
                logger.error(err);
                return cb(err);
            }
            cb(err);
        });
    });
};

//register access requests
module.exports.reqAccToEtry = function (eids, user, cb) {
    var requester = user.email;

    async.map(eids, function (eid, next) {
        EntrySchema.findById(eid, function (err, entry) {
            if (err)  return next(err);
            if (!entry) return next({message: 'Entry not found'});

            User.findOne({email: entry.publisher}, function (err, owner) {
                if (err || !owner) return next(err || {message: 'Owner not found'});

                owner.pendingreq.push({
                    sender: requester,
                    entry: eid
                });
                owner.save(function (err) {
                    next(err, eid);
                });
            });
        });
    }, function (err, eids) {
        if (err) return cb(err);

        eids.forEach(function(eid){
            user.accreq.push(eid);
        });

        user.save(cb);
    });
};

//aprove request access
module.exports.aprvAccToEtry = function (deny, reqIds, user, cb) {

    user.populate('pendingreq.entry', function (err) {
        if (err) return cb(err);

        async.map(reqIds, function (rid, next) {
            var req = user.pendingreq.id(rid);
            if (!req) return next({
                message: 'Unknown request'
            });
            if (deny)
                denyAccess(req, function (err) {
                    req.remove();
                    next(err, req);
                });
            else
                grantAccess(req, function (err) {
                    req.remove();
                    next(err, req);
                });
        }, function (err, reqs) {
            if (err) return cb(err);
            user.save(cb);
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
            readable: entry._id,
            msg: {
                content: 'Your request for accessing ' + entry.name + ' has been approved',
                read: false
            }
        },
        $pull: {
            accreq: entry._id
        }
    };

    User.update(query, update, function (err, user) {
        if (user) logger.info('Request approved; user: ' + user.email + '; entry: ' + entry.url + ';');
        done(err, request);
    });
}

function denyAccess(request, done) {
    var entry = request.entry;
    var query = {
        email: request.sender
    };

    var update = {
        $push: {
            msg: {
                content: 'Your request for accessing ' + entry.name + ' has been denied',
                read: false
            }
        }
    };

    User.update(query, update, function (err, user) {
        if (user) logger.info('Request denied; user: ' + user.email + '; entry: ' + entry.url + ';');
        done(err, request);
    });
}
