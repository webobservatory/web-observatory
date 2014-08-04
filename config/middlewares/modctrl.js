'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Entry = mongoose.model('Entry'),
    async = require('async'),
    crypto = require('crypto'),
    logger = require('../../app/util/logger');

module.exports.visibleEtry = function (req, res, next) {

    var user = req.user,
        typ = req.params.typ;

    async.parallel([function (cb) {
        var query = {opVis: true};
        if (typ) {
            query.type = typ;
        }
        Entry.find(query, function (err, entries) {
            cb(err, entries);
        });
    }, function (cb) {
        if (user) {
            user.populate('own').populate('visible').populate('readable', cb);
        }
        else {
            cb();
        }
    }], function (err, results) {
        var entries, etry_ids;
        if (err) {
            return next(err);
        }

        entries = results[0];

        if (!req.attach) {
            req.attach = {};
        }
        req.attach.visibleEntries = entries;

        if (!user) {
            return next();
        }

        etry_ids = entries.map(function (e) {
            return e._id.toString();
        });

        user.own.forEach(function (entry) {
            if (typ !== entry.type) {
                return;
            }
            var index = etry_ids.indexOf(entry._id.toString());
            if (-1 === index) {
                entry = JSON.parse(JSON.stringify(entry));
                entry.opAcc = true;
                entries.push(entry);
            }
            else {
                entries[index].opAcc = true;
            }
        });

        user.readable.forEach(function (entry) {
            if (typ !== entry.type) {
                return;
            }
            var index = etry_ids.indexOf(entry._id.toString());
            if (-1 === index) {
                entry = JSON.parse(JSON.stringify(entry));
                entry.opAcc = true;
                entries.push(entry);
            }
            else {
                entries[index].opAcc = true;
            }
        });

        user.visible.forEach(function (entry) {
            if (typ !== entry.type) {
                return;
            }
            var index = etry_ids.indexOf(entry._id.toString());
            if (-1 === index) {
                entries.push(entry);
            }
        });

        next();
    });
};

module.exports.addEtry = function (email, etry, cb) {

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

    Entry.findById(etry_id, function (err, entry) {
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
            if (err) {
                return cb(err);
            }
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
