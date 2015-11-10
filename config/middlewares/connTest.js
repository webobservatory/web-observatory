/**
 * Created by xgfd on 01/12/14.
 */

var mongoose = require('mongoose'),
    Entry = mongoose.model('Entry'),
    queries = require('./dataset/queries'),
    lastTest = null,
    tester,
    logger = require('../../app/util/logger');

tester = function () {
    'use strict';
    Entry.find({}, function (err, datasets) {
        if (err) {
            return logger.error(err);
        }

        datasets.forEach(function (entry) {
            var test = queries.tests[entry.mediatype.toLowerCase()];

            if (!test) {
                return logger.error('No testers available for ' + entry.querytype);
            }

            test(entry, function (msg) {
                if (msg) {
                    logger.warn('dataset connTest ' + entry.url + ' ' + msg.toString());
                }

                var alive = true;
                if (msg) {
                    alive = false;
                }

                entry.alive = alive;
                entry.save();
            });

        });

        lastTest = Date.now();
    });
};

module.exports = function (req, res, next) {
    'use strict';
    var interval = Math.round((Date.now() - lastTest) / 1000) / 60 / 60;//interval in hours
    if (interval >= 12) {//check connection every 12 hours
        tester();
    }
    next();
};
