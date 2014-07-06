var mongoose = require('mongoose'),
    mgclient = require('mongodb').MongoClient;

var mongo_url = process.argv[2];

mongoose.connect(mongo_url);

var User = require('./app/models/user'),
    Entry = require('./app/models/entry');

User.aggregate([{
    $group: {
        _id: '$email',
        doc_ids: {
            $addToSet: '$_id'
        },
        count: {
            $sum: 1
        }
    }
}, {
    $match: {
        count: {
            $gte: 2
        }
    }
}], function(err, docs) {
    if (err) return console.log(err);
    console.log(docs);
    var dup_emails = docs.map(function(doc) {
        return doc._id;
    });
    console.log(dup_emails);
    dup_emails.forEach(function(email) {
        User.find({
            email: email
        }, function(err, users) {
            if (err) return console.log(err);
            if (users.length !== 2) return console.log('length err');
            var target, source;
            if (users[0].firstName) {
                target = users[0];
                source = users[1];
            } else {
                target = users[1];
                source = users[0];
            }

            /*
            console.log('target');
            console.log(target);
            console.log('source');
            console.log(source);
            */

            merge(target, source);
            target.save(function(err) {
                if (err) return console.log(err);
                source.remove(function(err) {
                    if (err) return console.log(err);

                    Entry.find({}, function(err, entries) {
                        if (err) return console.log('Entry:' + err.message);
                        if (!entries) return console.log('No entires found');

                        entries.forEach(function(entry) {
                            var user_mail = entry.publisher;
                            User.findOne({
                                email: user_mail
                            }, function(err, user) {
                                if (err) return console.log('User:' + err.message);
                                if (!user) return console.log('No users found');

                                entry.publisher_name = user.username || ((user.firstName ? user.firstName + ' ' : '') + (user.lastName || ''));
                                entry.save(function(err) {
                                    if (err) return console.log('Entry update:' + err.message);
                                    console.log(entry.name + ' updated');
                                });
                            });
                        });
                        return;
                    });
                });
            });
        });
    });
});

function merge(target, source) {
    if (!target || !source) return;
    var keys = ['firstName', 'lastName', 'own', 'pendingreq', 'accreq', 'visible','readable'];
    console.log(keys);
    keys.forEach(function(key) {
        if (0 === key.indexOf('_')) return;
        var value = target[key];
        var newvalue = source[key];
        if (!value instanceof Array && !value) return target[key] = newvalue;
        if (value instanceof Array) {
            console.log('array: ' + key);
            return target[key] = value.concat(newvalue);
        }
    });
}


var gracefulExit = function() {
    mongoose.connection.close(function() {
        console.log('Mongoose default connection with DB :' + mongo_url + ' is disconnected through app termination');
        process.exit(0);
    });
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
