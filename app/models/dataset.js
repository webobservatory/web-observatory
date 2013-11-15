var mongoose = require('mongoose');
var async = require('async');

DatasetSchema = mongoose.Schema({
    url: String,
    title: String,
    type: String,
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

DatasetSchema.statics.getEntry = function(data, done) {
    var User = require('./user');
    var query = {
        'owned.url': data.url,
        email: data.email,
    };

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
            _id: '$owned._id',
            title: '$owned.title',
            url: '$owned.url',
            publisher: '$owned.publisher',
            type: '$owned.type',
            visible: '$owned.visible',
            readable: '$owned.readable'
        }
    }, function(err, entry) {
        done(err, entry[0]);
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
