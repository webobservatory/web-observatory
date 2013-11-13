var sparql = require('../config/middlewares/sparql');
var User = require('../app/models/user');
var async = require('async');

String.prototype.contains = function(str) {
    return this.indexOf(str) !== -1;
};

module.exports = function() {
    var au = [];
    sparql.getDataset(function(err, datasets) {
        if (err)
            return console.log('Error retrieving all datasets: ' + err.message);
        async.map(datasets, function(dataset, cb) {
            User.findOne({
                email: dataset.email
            }, function(err, user) {
                if (au.indexOf(user.email) === -1){
                    au.push(user.email);
                }
                if (err)
                    return cb(err);
                if (!user) {
                    var owned = [];
                    var ownedVis = [];
                    if (dataset.class.toLowerCase().contains('dataset'))
                        owned.push({
                            url: dataset.url,
                            title: dataset.title,
                            publisher: dataset.email,
                            readable: dataset.readable === 'true',
                            visible: dataset.visible === 'true'
                        });

                    if (dataset.class.toLowerCase().contains('webpage'))
                        ownedVis.push({
                            url: dataset.url,
                            title: dataset.title,
                            publisher: dataset.email,
                            readable: dataset.readable === 'true',
                            visible: dataset.visible === 'true'
                        });

                    User.create({
                        email: dataset.email,
                        'owned': owned,
                        'ownedVis': ownedVis
                    }, function(err, user) {
                        cb(err, user);
                    });
                } else {
                    var entry = {
                        url: dataset.url,
                        title: dataset.title,
                        publisher: dataset.email,
                        readable: dataset.readable === 'true',
                        visible: dataset.visible === 'true'
                    };

                    if (dataset.class.toLowerCase().contains('dataset'))
                        User.addOwn(dataset.email, entry, cb);
                    else
                        User.addOwnVis(dataset.email, entry, cb);
                }
            });
        },

        function(err, results) {
            var new_users = 0;
            for (i = 0; i < results.length; i++) {
                if (results[i] !== 0)
                    new_users++;
            }
            if (err) return console.log('Error initilising: ' + err.message);
            console.log('Initilisation completed, ' + au.length + ' existing users, ' + new_users + ' new users have been created.');
        });
    });
};
