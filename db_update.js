var mongoose = require('mongoose'),
    mgclient = require('mongodb').MongoClient;

var mongo_url = process.argv[2];

mongoose.connect(mongo_url);

var User = require('./app/models/user'),
    Entry = require('./app/models/entry');

User.aggregate().exec(function(err, docs){});


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
