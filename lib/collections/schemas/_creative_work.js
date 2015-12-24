/**
 * Created by xgfd on 17/12/2015.
 */

SimpleSchema.extendOptions({
    noneditable: Match.Optional(Boolean)
});

var Thing = {
    name: {
        type: String,
        unique: true,
        label: 'Name'
    },

    //url: {
    //    type: String,
    //    unique: true,
    //    optional: true,
    //    label: 'URL',
    //    regEx: SimpleSchema.RegEx.Url
    //},

    description: orion.attribute('summernote', {
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
        autoValue: function () {
            if (this.isInsert) {
                return 0;
            }
        },
        autoform: {
            readonly: true,
        },
        noneditable: true,
    },

    creator: {
        type: String,
        label: 'Creator',
        optional: true,
        //autoValue: function () {
        //    var user = Meteor.user();
        //    return user.profile.name;
        //}
    },

    publisher: orion.attribute('hasOne', {
        type: String,
        label: 'Publisher',
        //autoValue: function () {
        //    var user = Meteor.user();
        //    return user.profile.name;
        //},
        autoform: {
            readonly: true,
        },
        noneditable: true,
    }, {
        collection: Meteor.users,
        // the key whose value you want to show for each Post document on the Update form
        titleField: 'username',
        publicationName: 'publisher',
    }),

    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    datePublished: {
        type: Date,
        denyUpdate: true,
        autoform: {
            readonly: true,
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
        noneditable: true,
    },

    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    dateModified: {
        type: Date,
        autoform: {
            readonly: true,
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

var Mis = {
    upvoters: {
        type: [String],
        optional: true,
        noneditable: true,
        autoform: {
            readonly: true,
        }
    },

    votes: {
        type: Number,
        noneditable: true,
        autoform: {
            readonly: true,
        },
        optional: true
    },

    //whether this entry is online
    online: {
        type: Boolean,
        noneditable: true,
        autoform: {
            readonly: true,
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

Whitelist = _.filter(_.keys(CreativeWork), function (property) {
    return !CreativeWork[property].noneditable;
});

BlackList = _.filter(_.keys(CreativeWork), function (property) {
    return CreativeWork[property].noneditable;
});
