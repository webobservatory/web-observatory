var sparql = require('../config/middlewares/sparql');
var logger = require('../app/util/logger');
var User = require('../app/models/user');
var Etry = require('../app/models/entry');
var async = require('async');

String.prototype.contains = function(str) {
    return this.indexOf(str) !== -1;
};

module.exports = function() {
    var exist = [];
    sparql.getDataset(function(err, entries) {
        if (err) return logger.error('Error retrieving all entries: ' + err.message);
        //entries contains all entries order by publisher email
        var users = [];
        for (var key in entries) {
            var et = entries[key];
            if (users.indexOf(et.email) === -1)
                users.push(et.email);
        }

        async.map(users, function(usr_email, cb) {
            User.update({
                email: usr_email
            }, {
                $set: {
                    email: usr_email
                }
            }, {
                upsert: true
            }, cb);
        },

        function(err, results) {
            if (err) return logger.error(err.message);

            async.map(entries, function(et, cb) {
                Etry.findOne({
                    url: et.url
                }, function(err, entry) {
                    if (err) return cb(err);

                    if (!entry) entry = new Etry();

                    entry.url = et.url;
                    entry.name = et.title;
                    entry.publisher = et.email;
                    if(et.class.indexOf('Dataset') !== -1) entry.type = 'dataset';
                    if(et.class.indexOf('WebPage') !== -1) entry.type = 'visualisation';
                    entry.des = et.des;
                    entry.readable = et.readable === 'true';
                    entry.visible = et.visible === 'true';
                    entry.querytype = et.addType || '';
                    entry.creator = et.creator || '';
                    entry.related = et.basedOn || '';
                    entry.save(function(err) {
                    if(err) return cb(err,entry);
                    logger.info('entry: '+entry);
                        if (exist.indexOf(entry.publisher) === -1) {
                            exist.push(entry.publisher);
                        }
                            User.addOwn(et.email, entry._id, cb);
                    });
                });
            }, function(err, results) {
                var updated_usr = 0;
                for (i = 0; i < results.length; i++) {
                    if (typeof results[i] === 'object')
                        new_users++;
                    else
                        updated_usr += results[i];
                }
                if (err) return logger.error('Error initilising: ' + err.message);
                logger.info('Initilisation completed, ' + exist.length + ' existing users, ' + updated_usr + ' updates have been made.');
            });
        });
    });
};
