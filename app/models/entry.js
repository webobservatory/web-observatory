var mongoose = require('mongoose');
var async = require('async');

var EntrySchema = mongoose.Schema({
    url: String,
    name: String,
    type: String,
    querytype: String,
    creator: String,
    publisher: String, //email of the publisher
    opAcc: {
        type: Boolean,
        default: true
    }, //open access?
    opVis: {
        type: Boolean,
        default: true
    }, //visible to public?
    related: String, //related sources
    lice: String,
    kw: [String],
    des: String
});
var Entry = mongoose.model('Entry', EntrySchema);
module.exports = Entry;
