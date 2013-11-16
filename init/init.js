var sparql = require('../config/middlewares/sparql');
var User = require('../app/models/user');
var async = require('async');

String.prototype.contains = function(str) {
    return this.indexOf(str) !== -1;
};

module.exports = function() {
    var exist = [];
    sparql.getDataset(function(err, datasets) {
        if (err)
            return console.log('Error retrieving all datasets: ' + err.message);
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
            if (err) return console.log(err.message);

            async.map(datasets, function(dataset, cb) {
                User.findOne({
                    email: dataset.email
                }, function(err, user) {
                    if (err)
                        return cb(err);

                    var entry = {
                        url: dataset.url,
                        title: dataset.title,
                        publisher: dataset.email,
                        type: dataset.addType,
                        readable: dataset.readable === 'true',
                        visible: dataset.visible === 'true'
                    };

                    if (!user) {
                        return cb({
                            message: 'User not found'
                        });
                    } else {
                        if (exist.indexOf(user.email) === -1) {
                            exist.push(user.email);
                        }
                        if (dataset.class.toLowerCase().contains('dataset'))
                            User.addOwn(dataset.email, entry, cb);
                        else
                            User.addOwnVis(dataset.email, entry, cb);
                    }
                });
            }, function(err, results) {
                var updated_usr = 0;
                for (i = 0; i < results.length; i++) {
                    if (typeof results[i] === 'object')
                        new_users++;
                    else
                        updated_usr += results[i];
                }
                if (err) return console.log('Error initilising: ' + err.message);
                console.log('Initilisation completed, ' + exist.length + ' existing users, ' + updated_usr + ' updates have been made.');
            });

        });
    });
};
