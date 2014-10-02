'use strict';
var mongoose = require('mongoose'),
    async = require('async');

var EntrySchema = mongoose.Schema({
    url: String,
    name: String,
    type: String, //dataset? visualisation? etc.
    querytype: String, //query interface tyep. e.g. sparql, mysql, mongodb
    creator: String, //creator of this entry
    publisher: String, //email of the publisher. use email in case user._id goes wrong it's easier to recover
    publisher_name: String, //name of the publisher
    pubdate: {
        type: Date,
        default: Date.now
    },
    opAcc: {
        type: Boolean,
        default: true
    }, //open access?
    opVis: {
        type: Boolean,
        default: true
    }, //visible to public?
    canView: [String],//user emails that can view this entry. use email in case user._id goes wrong it's easier to recover
    canAccess: [String],//user emails that can access this entry. use email in case user._id goes wrong it's easier to recover
    auth: {
        apikey: String,
        user: String,
        encpwd: String //encrypted password
    },
    related: String, //related sources
    git: String, //github url if applicable
    lice: String, //licence
    kw: [String], //keywords
    des: String //description
});
EntrySchema.index({ "$**": "text" });
var Entry = mongoose.model('Entry', EntrySchema);
Entry.ensureIndexes(function(err){console.log(err);});
module.exports = Entry;
