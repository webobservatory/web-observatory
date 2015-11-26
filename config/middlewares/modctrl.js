'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Entry = mongoose.model('Entry'),
    Project = mongoose.model('Project'),
    License = mongoose.model('License'),
    async = require('async'),
    crypto = require('crypto'),
    logger = require('../../app/util/logger');

function search(col, query, user, cb) {
    var aggregate,
        visOption = [];

    switch (col) {
        case 'license':
            aggregate = License.aggregate();
            break;

        case 'project':
            aggregate = Project.aggregate();

            visOption.push({
                opVis: true
            });

            if (user) {
                visOption.push({
                    creator: user.email
                }, {
                    member: user.email
                });
            }
            break;

        case 'dataset':
        case 'app':
        case 'visualisation':
            aggregate = Entry.aggregate();

            query.type = col;

            visOption.push({
                opVis: true
            });

            if (user) {
                visOption.push({
                    publisher: user.email
                }, {
                    canView: user.email
                });
            }

            query.vis = visOption;
            break;
    }

    //construct aggregation pipeline
    var q;
    for (q in query) {
        if (query.hasOwnProperty(q)) {
            var v = query[q];

            //normalise
            v = typeof v === 'string' ? v.trim() : v;

            switch (q) {

                //***********************
                //special cases
                //***********************

                //q or query for freetext search
                case 'q':
                case 'text':
                case 'query':
                    aggregate.append({
                        $match: {
                            $text: {
                                $search: v
                            }
                        }
                    });

                    break;

                    //typ or cat or category for category 
                case 'typ':
                case 'cat':
                case 'category':
                    aggregate.append({
                        $match: {
                            type: v
                        }
                    });
                    break;

                    //matching id
                case 'id':
                    aggregate.append({
                        $match: {
                            _id: v
                        }
                    });
                    break;

                case 'mediatype':
                    aggregate.append({
                        $match: {
                            querytype: v
                        }
                    });
                    break;

                case 'mongodb':
                    aggregate.append({
                        $match: JSON.parse(v)
                    });
                    break;

                case 'vis':
                    aggregate.append({
                        $match: {
                            $or: v
                        }
                    });
                    break;

                default:
                    var match = {};
                    match[q] = v;
                    aggregate.append({
                        $match: match
                    });
            }
        }
    }

    aggregate.append({
            $sort: {
                modified: -1,
                name: 1
            }
        })
        .exec(cb);
}

module.exports.search = function(req, res, next) {
    var user = req.user,
        query = req.query,
        visOption = [];

    search(req.params.typ, query, user, function(err, results) {
        if (err) {
            return next(err);
        }

        req.attach = req.attach || {};
        req.attach.search = results;
        next();
    });
};

module.exports.licenses = function(req, res, next) {
    License.find({}, function(err, licenses) {
        if (err) {
            return next(err);
        }

        req.attach = req.attach || {};
        req.attach.licenses = licenses;
        next();
    })
};

module.exports.getProj = function(req, res, next) {
    var userid = req.user ? req.user._id : null;
    Project.findById(req.params.id, function(err, proj){
    
    if (err) {
            return next(err);
        }

    proj.isOwner = false;
    if (useruserid == proj.creator.toString()) {
        //short cut fields for display
        proj.isOwner = true;
        proj.haveAcc = true;
        }

    req.attach = req.attach || {};
    req.attach.proj = proj;
    next();

    });
};

module.exports.addProj = function(req, res, next) {
    var user = req.user,
        email = user.emial,
        etry = req.body;

    etry.creator = user._id;
    etry.member = [user._id];
    etry.opVis = etry.vis !== 'false';

    Project.findOne({
        name: etry.name
    }, function(err, entry) {
        if (entry) {
            logger.warn('Existing project; user: ' + email + '; entry: ' + (entry.url || entry.name) + ';');
            return next(new Error('Existing project; user: ' + email + '; entry: ' + (entry.url || entry.name) + ';'));
        }

        Project.create(etry, function(err, entry) {
            if (err) {
                logger.error(err);
                return next(err);
            }
            user.ownproj.push(entry._id);
            user.save(function(err) {
                if (err) {
                    return next(err);
                }
                next();
            });
        });
    });
};

module.exports.addEtry = function(user, etry, cb) {

    var email = user.email;
    //TODO use unique instead
    Entry.findOne({
        // $or: [{
        name: etry.name
            // }, {
            // url: etry.url
            // }]
    }, function(err, entry) {
        var key, enc_alg, pwd, encrypted, cipher;

        if (err) {
            logger.error(err);
            return cb(err);
        }
        if (entry) {
            logger.warn('Existing entry; user: ' + email + '; entry: ' + (entry.url || entry.name) + ';');
            return cb({
                message: 'Existing entry name'
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

        Entry.create(etry, function(err, entry) {
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

module.exports.editEtry = function(etry_id, update, cb) {

    Entry.findById(etry_id, function(err, entry) {
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
module.exports.reqAccToEtry = function(eids, user, cb) {
    var requester = user.email;

    async.map(eids, function(eid, next) {
        Entry.findById(eid, function(err, entry) {
            if (err) {
                return next(err);
            }
            if (!entry) {
                return next({
                    message: 'Entry not found'
                });
            }

            User.findOne({
                email: entry.publisher
            }, function(err, owner) {
                if (err || !owner) {
                    return next(err || {
                        message: 'Owner not found'
                    });
                }

                owner.pendingreq.push({
                    sender: requester,
                    entry: eid
                });
                owner.save(function(err) {
                    next(err, eid);
                });
            });
        });
    }, function(err, eids) {
        if (err) {
            return cb(err);
        }

        eids.forEach(function(eid) {
            user.accreq.push(eid);
        });

        user.save(cb);
    });
};

//aprove request access

function grantAccess(request, done) {
    var entry = request.entry,
        senderMail = request.sender,
        query, update;

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

    User.update(query, update, function(err, user) {
        if (user) {
            logger.info('Request approved; user: ' + user.email + '; entry: ' + entry.url + ';');
        }
        done(err, request);
    });

    entry.canAccess.push(senderMail);
}

function denyAccess(request, done) {
    var entry = request.entry,
        query, update;
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

    User.update(query, update, function(err, user) {
        if (user) {
            logger.info('Request denied; user: ' + user.email + '; entry: ' + entry.url + ';');
        }
        done(err, request);
    });
}
module.exports.aprvAccToEtry = function(deny, reqIds, user, cb) {

    user.populate('pendingreq.entry', function(err) {
        if (err) {
            return cb(err);
        }

        async.map(reqIds, function(rid, next) {
            var req = user.pendingreq.id(rid);
            if (!req) {
                return next({
                    message: 'Unknown request'
                });
            }
            if (deny) {
                denyAccess(req, function(err) {
                    req.remove();
                    next(err, req);
                });
            } else {
                grantAccess(req, function(err) {
                    req.remove();
                    next(err, req);
                });
            }
        }, function(err, reqs) {
            if (err) {
                return cb(err);
            }
            user.save(cb);
        });
    });
};
