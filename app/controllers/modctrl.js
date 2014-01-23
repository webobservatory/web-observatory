var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    EntrySchema = mongoose.model('Entry'),
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
        }, function(err, user) {
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
                if (etry_ids.indexOf(own[i]._id.toString()) === -1 && own[i].type === typ) {
                    entries.push(own[i]);
                }
            }

            var readable = user.readable;

            for (i = 0; i < readable.length; i++) {
                if (etry_ids.indexOf(readable[i]._id.toString()) === -1 && readable[i].type === typ) {
                    entries.push(readable[i]);
                }
            }

            cb(null, entries);
        });
    });
};

module.exports.addEtry = function(email, etry, cb) {

    EntrySchema.findOne(etry, function(err, entry) {
        if (err) {
            logger.error(err);
            return cb(err);
        }
        if (entry) {
            logger.warn('Existing entry; user: ' + email + '; entry: ' + (entry.url || entry.name) + ';');
            return cb({
                message: 'Tried to add an existing entry'
            });
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
