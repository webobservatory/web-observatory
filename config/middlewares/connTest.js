/**
 * Created by xgfd on 01/12/14.
 */

var mongoose = require('mongoose'),
    Entry = mongoose.model('Entry'),
    queries = require('./dataset/queries'),
    lastTest = null,
    tester;

tester = function () {
    'use strict';
    Entry.find({type: 'dataset'}, function (err, datasets) {
        if (err) {
            return console.error(err);
        }
        datasets.forEach(function (ds) {
            var test = queries.tests[ds.querytype.toLowerCase()];
            if (!test) {
                return console.error('No testers available for ' + ds.querytype);
            }
            test(ds, function (msg) {
                console.log(ds.url);
                console.log(msg);
                var alive = true;
                if (msg) {
                    alive = false;
                }
                ds.alive = alive;
                ds.save();
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
