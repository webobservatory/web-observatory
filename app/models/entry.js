var mongoose = require('mongoose'),
    async = require('async');

var EntrySchema = mongoose.Schema({
    url: String,
    name: {type: String, index: true},
    type: String, //dataset? visualisation? etc.
    querytype: {type: String, index: true}, //query interface tyep. e.g. sparql, mysql, mongodb
    creator: {type: String, index: true}, //creator of this entry
    publisher: String, //email of the publisher. use email in case user._id goes wrong it's easier to recover
    publisher_name: {type: String, index: true}, //name of the publisher
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
    lice: {type: String, index: true}, //licence
    kw: {type: [String], index: true}, //keywords
    des: {type: String, index: true} //description
});
var Entry = mongoose.model('Entry', EntrySchema);
module.exports = Entry;
