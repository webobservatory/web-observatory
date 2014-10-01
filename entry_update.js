'use strict';
var mongoose = require('mongoose');

var mongo_url = process.argv[2];

mongoose.connect(mongo_url);

var User = require('./app/models/user'),
    Entry = require('./app/models/entry');

User.find({}, function (err, users) {
    if (err) {
        return console.log(err);
    }

    users.forEach(function (user) {
        user.populate('own').populate('visible').populate('readable').exec(function (err, user) {

            if (err) {
                return console.log(err);
            }

            user.visible.forEach(function (entry) {
                entry.canView.push(user.email);
                entry.save(function (err) {
                    if (err) {
                        console.log('add view');
                        console.log(err);
                    }
                });
            });

            user.readable.forEach(function (entry) {
                entry.canAccess.push(user.email);
                entry.save(function (err) {
                    if (err) {
                        console.log('add access');
                        console.log(err);
                    }
                });
            });

            user.own.forEach(function (entry) {
                entry.canView.push(user.email);
                entry.canAccess.push(user.email);
                entry.save(function (err) {

                    if (err) {
                        console.log('add own');
                        console.log(err);
                    }
                });
            });

            console.log('finished');
        });
    });
});


var gracefulExit = function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection with DB :' + mongo_url + ' is disconnected through app termination');
        process.exit(0);
    });
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
