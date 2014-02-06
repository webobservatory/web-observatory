var mongoose = require('mongoose'),
    async = require('async');

var EntrySchema = mongoose.Schema({
    url: String,
    name: String,
    type: String, //dataset? visualisation? etc.
    querytype: String, //query interface tyep. e.g. sparql, mysql, mongodb
    creator: String, //creator of this entry
    publisher: String, //email of the publisher
    opAcc: {
        type: Boolean,
        default: true
    }, //open access?
    opVis: {
        type: Boolean,
        default: true
    }, //visible to public?
    auth: {
        apikey: String,
        user: String,
        encpwd: String, //encrypted password
    },
    related: String, //related sources
    git: String, //github url if applicable
    lice: String, //licence
    kw: [String], //keywords
    des: String //description
});
var Entry = mongoose.model('Entry', EntrySchema);
module.exports = Entry;
