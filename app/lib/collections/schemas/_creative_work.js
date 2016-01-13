/**
 * Created by xgfd on 17/12/2015.
 */
SimpleSchema.debug = true;
SimpleSchema.extendOptions({
    noneditable: Match.Optional(Boolean)
});

Thing = {
    name: {
        type: String,
        unique: true,
        label: 'Name'
    },

    description: orion.attribute('froala', {
        label: 'Description'
    })
};

CreativeWork = {
    comments: orion.attribute('hasMany', {
        type: [String],
        label: 'Comments',
        // optional is true because you can have a post without comments
        optional: true,
        noneditable: true,
    }, {
        collection: Comments,
        titleField: 'body',
        publicationName: 'rel_comments'
    }),

    commentsCount: {
        type: Number,
        defaultValue: 0,
        autoform: {
            readonly: true,
        },
        noneditable: true,
    },

    creator: {
        type: String,
        label: 'Creator',
        optional: true,
    },

    publisher: orion.attribute('hasOne', {
        type: String,
        label: 'Publisher',
        autoform: {
            readonly: true,
        },
        noneditable: true,
    }, {
        collection: Meteor.users,
        // the key whose value you want to show for each Post document on the Update form
        titleField: 'username',
        publicationName: 'publisher'
    }),

    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    datePublished: {
        type: Date,
        denyUpdate: true,
        autoform: {
            readonly: true,
            type: "pickadate"
        },
        autoValue: function () {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {$setOnInsert: new Date()};
            } else {
                this.unset(); // Prevent user from supplying their own value
            }
        },
        noneditable: true
    },

    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    dateModified: {
        type: Date,
        autoform: {
            readonly: true,
            type: "pickadate"
        },
        autoValue: function () {
            if (this.isUpdate || this.isInsert) {
                return new Date();
            }
        },
        noneditable: true,
        optional: true
    },

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
        label: 'License'
    }
};

Mis = {
    upvoters: {
        type: [String],
        optional: true,
        autoform: {
            readonly: true
        }
    },

    votes: {
        type: Number,
        autoform: {
            readonly: true
        },
        optional: true
    },

    // whether this entry is online
    // in case of a dataset, it's offline if any of its distribution is offline
    online: {
        type: Boolean,
        autoform: {
            readonly: true,
            type: 'hidden'
        },
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
        // optional is true because you can have a post without comments
        optional: true
    }, {
        collection: Meteor.users,
        titleField: 'username',
        publicationName: 'metawhitelist'
    }),

    //who can access this entry disregards acl settings
    contentWhiteList: orion.attribute('hasMany', {
        type: [String],
        label: 'Permitted to access',
        // optional is true because you can have a post without comments
        optional: true
    }, {
        collection: Meteor.users,
        titleField: 'username',
        publicationName: 'contentwhitelist'
    })
};

_.extend(CreativeWork, Thing);
_.extend(CreativeWork, Mis);

//TODO clean up use of whitelist/blacklist
Whitelist = _.filter(_.keys(CreativeWork), function (property) {
    return !CreativeWork[property].noneditable;
});

BlackList = _.filter(_.keys(CreativeWork), function (property) {
    return CreativeWork[property].noneditable;
});
