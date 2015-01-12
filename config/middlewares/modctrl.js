'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Entry = mongoose.model('Entry'),
    async = require('async'),
    crypto = require('crypto'),
    logger = require('../../app/util/logger');

module.exports.visibleEtry = function (req, res, next) {

    var user = req.user,
        typ = req.param('typ'),
        match = req.query.query,
        id = req.query.id,
        visOption = [],
        aggregate = Entry.aggregate();

    //normalise params
    match = match ? match.trim() : match;
    id = id ? id.trim() : id;
    typ = typ ? typ.trim().toLowerCase() : typ;

    if (match) {
        aggregate.append({$match: {$text: {$search: match}}});
    }

    if (id) {
        aggregate.append({$match: {_id: id}});
    }

    if (typ) {
        aggregate.append({$match: {type: typ}});
    }

    //filter entries that are either publicly visible or visible to this user
    visOption.push({opVis: true});
    if (user) {
        visOption.push({publisher: user.email}, {canView: user.email});
    }

    aggregate
        .append({$match: {$or: visOption}})
        .append({$sort: {alive: -1, name: 1}})
        .exec(function (err, entries) {
            if (err) {
                return next(err);
            }

            req.attach = req.attach || {};
            req.attach.visibleEntries = entries;
            next();
        });
};

module.exports.addEtry = function (user, etry, cb) {

    var email = user.email;
    //TODO use unique instead
    Entry.findOne({
        $or: [
            {
                name: etry.name
            },
            {
                url: etry.url
            }
        ]
    }, function (err, entry) {
        var key, enc_alg, pwd, encrypted, cipher;

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
            key = etry.url;
            enc_alg = 'aes256';
            pwd = etry.auth.encpwd;

            cipher = crypto.createCipher(enc_alg, key);
            encrypted = cipher.update(pwd, 'utf8', 'hex') + cipher.final('hex');
            etry.auth.encpwd = encrypted;
        }

        Entry.create(etry, function (err, entry) {
            if (err) {
                logger.error(err);
                return cb({
                    message: 'Failed to create entry ' + (etry.name || etry.url)
                });
            }
            user.own.push(entry._id);
            user.save(cb);
        });
    });
};

module.exports.editEtry = function (etry_id, update, cb) {

    Entry.findById(etry_id, function (err, entry) {
        var key;
        if (err) {
            logger.error(err);
            return cb(err);
        }
        if (!entry) {
            logger.warn('Entry not found' + ' entry: ' + etry_id + ';');
            return cb({
                message: 'Entry not found'
            });
        }

        for (key in update) {
            if (update.hasOwnProperty(key)) {
                entry[key] = update[key];
            }
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
        Entry.findById(eid, function (err, entry) {
            if (err) {
                return next(err);
            }
            if (!entry) {
                return next({message: 'Entry not found'});
            }

            User.findOne({email: entry.publisher}, function (err, owner) {
                if (err || !owner) {
                    return next(err || {message: 'Owner not found'});
                }

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
        if (err) {
            return cb(err);
        }

        eids.forEach(function (eid) {
            user.accreq.push(eid);
        });

        user.save(cb);
    });
};

//aprove request access

function grantAccess(request, done) {
    var entry = request.entry, senderMail = request.sender, query, update;

    query = {
        email: senderMail,
        readable: {
            $ne: entry._id
        }
    }; //grant access only if the user cannot access to the given entry

    update = {
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
        if (user) {
            logger.info('Request approved; user: ' + user.email + '; entry: ' + entry.url + ';');
        }
        done(err, request);
    });

    entry.canAccess.push(senderMail);
}

function denyAccess(request, done) {
    var entry = request.entry, query, update;
    query = {
        email: request.sender
    };

    update = {
        $push: {
            msg: {
                content: 'Your request for accessing ' + entry.name + ' has been denied',
                read: false
            }
        }
    };

    User.update(query, update, function (err, user) {
        if (user) {
            logger.info('Request denied; user: ' + user.email + '; entry: ' + entry.url + ';');
        }
        done(err, request);
    });
}
module.exports.aprvAccToEtry = function (deny, reqIds, user, cb) {

    user.populate('pendingreq.entry', function (err) {
        if (err) {
            return cb(err);
        }

        async.map(reqIds, function (rid, next) {
            var req = user.pendingreq.id(rid);
            if (!req) {
                return next({
                    message: 'Unknown request'
                });
            }
            if (deny) {
                denyAccess(req, function (err) {
                    req.remove();
                    next(err, req);
                });
            }
            else {
                grantAccess(req, function (err) {
                    req.remove();
                    next(err, req);
                });
            }
        }, function (err, reqs) {
            if (err) {
                return cb(err);
            }
            user.save(cb);
        });
    });
};

