var sparql = require('../config/middlewares/sparql');
var logger = require('../app/util/logger');
var User = require('../app/models/user');
var Ds = require('../app/models/dataset');
var async = require('async');

String.prototype.contains = function(str) {
    return this.indexOf(str) !== -1;
};

module.exports = function() {
    var exist = [];
    sparql.getDataset(function(err, datasets) {
        if (err) return logger.error('Error retrieving all datasets: ' + err.message);
        //datasets contains all datasets order by publisher email
        var users = [];
        for (var key in datasets) {
            var dataset = datasets[key];
            if (users.indexOf(dataset.email) === -1)
                users.push(dataset.email);
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

            async.map(datasets, function(dataset, cb) {
                Ds.findOne({
                    publisher: dataset.email
                }, function(err, ds) {
                    if (err) return cb(err);

                    if (!ds) ds = new Ds();

                    ds.url = dataset.url;
                    ds.title = dataset.title;
                    ds.publisher = dataset.email;
                    ds.type = dataset.addType;
                    ds.readable = dataset.readable === 'true';
                    ds.visible = dataset.visible === 'true';
                    ds.save(function(err) {
                    if(err) return cb(err,ds);
                    logger.info('ds: '+ds);
                        if (exist.indexOf(ds.publisher) === -1) {
                            exist.push(ds.publisher);
                        }
                        if (dataset.class.toLowerCase().contains('dataset'))
                            User.addOwnDs(dataset.email, ds._id, cb);
                        else
                            User.addOwnVis(dataset.email, ds._id, cb);
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
