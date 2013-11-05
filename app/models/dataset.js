var mongoose = require('mongoose');
var async = require('async');

DatasetSchema = mongoose.Schema({
    url: String,
    title: String,
    creator: String //email of the creator
});

/*
DatasetSchema.statics.findEntryById = function(oid, done) {
    this.findById(oid, function(err, dataset) {
        if (err) return done(false, err);
        if (!dataset) return done(false, 'No entry found.');
        done(dataset);
    });
};
*/

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
        creator: data.creator,
    };

    this.findOne(query, function(err, entry) {

        if (err)
            return done(err);

        if (entry)
            return done(false, entry);

        var new_entry = {
            url: data.url,
            title: data.title,
            creator: data.creator,
            readable: data.readable
        };
        this.create(new_entry, function(err, entry) {
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
