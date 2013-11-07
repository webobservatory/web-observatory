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
    var query = {
        url: data.url,
        publisher: data.email,
    };

    Dataset.findOne(query, function(err, entry) {

        if (err)
            return done(err);

        if (entry)
            return done(false, entry);

        var new_entry = {
            url: data.url,
            title: data.title,
            publisher: data.email,
            readable: data.readable !== 'false',
            visible: data.visible === 'true'
        };
        Dataset.create(new_entry, function(err, entry) {
            done(err, entry);
        });
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
