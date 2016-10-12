/**
 * Created by xgfd on 17/12/2015.
 */
// SimpleSchema.debug = true;
// SimpleSchema.extendOptions({
//     //noneditable: Match.Optional(Boolean)
// });

Thing = {
    name: {
        type: String,
        unique: true,
        label: 'Name'
    },

    description: orion.attribute('summernote', {
        label: 'Description',
        optional: true
    })
};

CreativeWork = {
    comments: orion.attribute('hasMany', {
        type: [String],
        label: 'Comments',
        // optional is true because you can have a post without comments
        optional: true,
        //noneditable: true
    }, {
        collection: Comments,
        titleField: 'body',
        publicationName: 'rel_comments'
    }),

    commentsCount: {
        type: Number,
        autoValue() {
            var comments = this.field("comments");
            return comments ? comments.length : 0;
        },
        optional: true,
        autoform: {
            omit: true
        },
        //noneditable: true
    },

    creator: {
        type: String,
        label: 'Creator',
        optional: true
    },

    publisher: orion.attribute('createdBy'),

    publisherName: {
        type: String,
        optional: true,
        autoform: {
            type: 'hidden'
            // omit: true
        },
        autoValue() {
            let publisher = this.field('publisher');
            if (publisher.isSet) {
                let pId = publisher.value;
                let user = Meteor.users.findOne(pId);
                if (user) {
                    return user.username;
                } else {
                    this.unset();
                }
            } else {
                this.unset();
            }
        }
    },
    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    datePublished: orion.attribute('createdAt'),

    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    dateModified: orion.attribute('updatedAt'),

    isBasedOnUrl: orion.attribute('hasMany', {
        type: [String],
        label: 'Related datasets',
        optional: true
    }, {
        collection: Datasets,
        titleField: 'name',
        publicationName: 'isbasedonurl'
    }),

    keywords: {
        type: [String],
        label: 'Keywords',
        optional: true
    },

    license: {
        type: String,
        label: 'License',
        autoform: {
            options() {
                let addedLices = Licenses.find().fetch();

                let options = [];
                defaultLicenses.forEach(name => {
                    options.push({label: name.toUpperCase(), value: name});
                });

                addedLices.forEach(lice => {
                    if (lice.name) {
                        let name = lice.name;
                        options.push({label: name.toUpperCase(), value: name});
                    }
                });

                return options;
            }
        }
    }
};

Mis = {
    upvoters: {
        type: [String],
        optional: true,
        autoform: {
            omit: true
        }
    },

    votes: {
        type: Number,
        autoform: {
            omit: true
        },
        optional: true,
        autoValue() {
            let voters = this.field('upvoters');
            return voters ? voters.length : 0;
        }
    },

    downvoters: {
        type: [String],
        optional: true,
        autoform: {
            omit: true
        }
    },

    downvotes: {
        type: Number,
        autoform: {
            omit: true
        },
        optional: true,
        autoValue() {
            let voters = this.field('downvoters');
            return voters ? voters.length : 0;
        }
    },

    // whether this entry is online
    // in case of a dataset, it's offline if any of its distribution is offline
    online: {
        type: Boolean,
        autoform: {
            readonly: true,
            type: 'hidden'
        },
        optional: true,
        defaultValue: true
    },

    //metadata permission i.e. visibility
    aclMeta: {
        type: Boolean,
        label: "Visible to everyone",
        defaultValue: true
    },

    //content permission i.e. queryability
    aclContent: {
        type: Boolean,
        label: "Accessible to everyone",
        defaultValue: true
    },

    //who can see this entry disregards acl settings
    metaWhiteList: orion.attribute('hasMany', {
        type: [String],
        label: 'Permitted to see',
        autoform: {
            omit: true
        },
        optional: true
    }, {
        collection: Meteor.users,
        titleField: 'username',
        publicationName: 'metawhitelist'
    }),

    //who can access this entry disregards acl settings
    contentWhiteList: orion.attribute('hasMany', {
        type: [String],
        label: 'Share to',
        optional: true
    }, {
        collection: Meteor.users,
        titleField: 'username',
        publicationName: 'contentwhitelist'
    })
};

_.extend(CreativeWork, Thing);
_.extend(CreativeWork, Mis);

omitFields = "publisher, comments, commentsCount, datePublished, dateModified, upvoters, downvoters, votes, downvotes, online, distribution.$._id".split(/\s*,\s*/);

setAtCreation = function (field, val) {
    if (val instanceof Function) {
        val = val();
    }
    if (field.isInsert) {
        return val;
    } else if (field.isUpsert) {
        return {$setOnInsert: val};
    } else {
        field.unset();
    }
};

setAtUpdate = function (field, val) {
    if (val instanceof Function) {
        val = val();
    }
    if (field.isUpdate || field.isInsert) {
        return val;
    } else if (field.isUpsert) {
        return {$setOnInsert: val};
    } else {
        //shouldn't reach here
        field.unset();
    }
};
