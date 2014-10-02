'use strict';
var mongoose = require('mongoose');

var mongo_url = process.argv[2];

console.log(mongo_url);

mongoose.connect(mongo_url);

var User = require('./app/models/user'),
    Entry = require('./app/models/entry');

User.find({}).populate('own').populate('visible').populate('readable').exec(function (err, users) {
    if (err) {
        return console.log(err);
    }

    users.forEach(function (user) {

        console.log('start adding view');
        if (!user.visible) {
            user.visible = [];
        }
        user.visible.forEach(function (entry) {
            if(entry.canView.indexOf(user.email) === -1) {
                entry.canView.push(user.email);
            }
            entry.save(function (err) {
                if (err) {
                    console.log('add view');
                    console.log(entry.name);
                    console.log(user.email);
                    console.log(err);
                }
            });
        });

        console.log('start adding access');
        if (!user.readable) {
            user.readable = [];
        }
        user.readable.forEach(function (entry) {
            if(entry.canAccess.indexOf(user.email) === -1) {
                entry.canAccess.push(user.email);
            }
            entry.save(function (err) {
                if (err) {
                    console.log('add access');
                    console.log(entry.name);
                    console.log(user.email);
                    console.log(err);
                }
            });
        });

        console.log('start adding own');
        if (!user.own) {
            user.own = [];
        }
        user.own.forEach(function (entry) {
            if(entry.canView.indexOf(user.email) === -1) {
                entry.canView.push(user.email);
            }
            
            if(entry.canAccess.indexOf(user.email) === -1) {
                entry.canAccess.push(user.email);
            }
            
            entry.save(function (err) {
                if (err) {
                    console.log('add own');
                    console.log(entry.name);
                    console.log(user.email);
                    console.log(err);
                }
            });
        });
    });
    console.log('finished');
});


var gracefulExit = function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection with DB :' + mongo_url + ' is disconnected through app termination');
        process.exit(0);
    });
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
