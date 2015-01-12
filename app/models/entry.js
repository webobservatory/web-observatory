'use strict';
var mongoose = require('mongoose'),
    async = require('async');

var EntrySchema = mongoose.Schema({
    //legacy usage: a dataset and its distribution are not distinguished; url is the accessURL. 
    url: String,
    name: String,
    type: String, //dataset? visualisation? etc.

    imported: {type: Boolean, default: false},
    distribution: [{
        title: String,
        description: String,
        issued: {type: Date, default: Date.now()},
        modified: {type: Date, default: Date.now()},
        accessURL: {type: String},
        mediaType: {type: String},
        format: String
    }],

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
    canView: {type: [String], default: []},//user emails that can view this entry. use email in case user._id goes wrong it's easier to recover
    canAccess: {type: [String], default: []},//user emails that can access this entry. use email in case user._id goes wrong it's easier to recover
    auth: {
        //apikey: String,
        user: String,
        encpwd: String //encrypted password
    },
    related: String, //related sources
    git: String, //github url if applicable
    lice: String, //licence
    kw: [String], //keywords
    des: String, //description
    queryinfo: String, //information required to access/query this entry
    alive: {type: Boolean, default: true} //entry connection alive? updated periodically
});
EntrySchema.index({"$**": "text"});
//EntrySchema.set('autoIndex', false);
var Entry = mongoose.model('Entry', EntrySchema);
Entry.on('index', function (err) {
    if (err) {
        console.log(err);
    }
});
module.exports = Entry;
