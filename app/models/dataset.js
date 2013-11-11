var mongoose = require('mongoose');
var async = require('async');

DatasetSchema = mongoose.Schema({
    url: String,
    title: String,
    publisher: String, //email of the publisher
    readable: Boolean,
    visible: Boolean
});

function transIter(row, done) {
    Dataset.getOrCreateEntry(row, function(err, entry) {
        if (err) return done(err, null);
        row.url = entry._id;
        done(null, row);
    });
}

DatasetSchema.statics.transform = function(rows, done) {
    async.map(rows, transIter, function(err, new_rows) {
        done(err, new_rows);
    });
};

DatasetSchema.statics.getOrCreateEntry = function(data, done) {
    var User = require('./user');
    var query = {
        'owned.url': data.url,
        email: data.email,
    };
    var update = {
        $addToSet: {
            owned: {
                url: data.url,
                title: data.title,
                publisher: data.email,
                readable: data.readable !== 'false',
                visible: data.visible === 'true'
            }
        }
    };

    User.findOne(query, function(err, user) {
        if (!user) {
            User.update({
                email: data.email
            }, update, {
                upsert: true
            }, function(err, user) {
                User.aggregate({
                    $match: {
                        email: data.email,
                    }
                }, {
                    $unwind: '$owned'
                }, {
                    $match: {
                        'owned.url': data.url,
                    }
                }, {
                    $project: {
                        _id: '$owned._id'
                    }
                },

                function(err, entry) {
                    done(err, entry[0]);
                });
            });
        } else {
            User.aggregate({
                $match: {
                    email: data.email,
                }
            }, {
                $unwind: '$owned'
            }, {
                $match: {
                    'owned.url': data.url,
                }
            }, {
                $project: {
                    _id: '$owned._id'
                }
            }, function(err, entry) {
                done(err, entry[0]);
            });
        }
    });
};

DatasetSchema.statics.getURL = function(oid, done) {
    this.findById(oid, function(err, entry) {
        if (err) return done(false, err);
        if (!entry) return done(false, 'No url found');
        done(entry.url);
    });
};

var Dataset = mongoose.model('Dataset', DatasetSchema);
module.exports = Dataset;
