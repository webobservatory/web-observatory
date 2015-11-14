'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ProjectSchema = mongoose.Schema({
    name: String,

    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    member: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],

    pubdate: {
        type: Date,
        default: Date.now
    },

    modified: {
        type: Date,
        default: Date.now()
    },

    opVis: {
        type: Boolean,
        default: true
    }, //visible to public?

    git: String, //github url if applicable
    kw: [String], //keywords
    des: String, //description
});

ProjectSchema.pre('save', function(next) {
    this.modified = new Date();
    next();
});

ProjectSchema.index({
    "$**": "text"
});

var Project = mongoose.model('Project', ProjectSchema);

Project.on('index', function(err) {
    if (err) {
        console.log(err);
    }
});

module.exports = Project;
