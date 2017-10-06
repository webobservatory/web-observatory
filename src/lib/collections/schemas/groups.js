/**
 * Created by xgfd on 24/12/2015.
 */

let Group = {
    name: {type: String},

    description: {type: String, optional: true},

    // url: {type: String, label: 'Home page', regEx: SimpleSchema.RegEx.Url, optional: true, autoform: {type: 'url'}},

    // youtube: {type: String, regEx: SimpleSchema.RegEx.Url, optional: true, autoform: {type: 'url'}},

    // github: {type: String, regEx: SimpleSchema.RegEx.Url, optional: true, autoform: {type: 'url'}},

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

    //who can access this entry disregards acl settings
    //used as Members field to reuse existing functions
    contentWhiteList: orion.attribute('hasMany', {
        type: [String],
        label: 'Members',
        // optional is true because you can have a post without comments
        optional: true
    }, {
        collection: Meteor.users,
        titleField: 'username',
        publicationName: 'groupmembers'
    }),

    datasets: orion.attribute('hasMany', {
        type: [String],
        label: 'Datasets',
        // optional is true because you can have a post without comments
        optional: true
    }, {
        collection: Datasets,
        titleField: 'name',
        publicationName: 'groupdatasets'
    }),

    apps: orion.attribute('hasMany', {
        type: [String],
        label: 'Apps',
        // optional is true because you can have a post without comments
        optional: true
    }, {
        collection: Apps,
        titleField: 'name',
        publicationName: 'groupapps'
    }),

    //publications: {type: [Object], label: "Publications", optional: true},
    "publications.$.name": {type: String, optional: true},
    "publications.$.url": {type: String, optional: true, autoform: {type: 'url'}},

    datePublished: orion.attribute('createdAt'),
    dateModified: orion.attribute('updatedAt'),
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
            type: 'hidden',
            readonly: true
        },
        defaultValue: true
    },

    //metadata permission i.e. visibility
    aclMeta: {
        type: Boolean,
        label: "Visible to everyone",
        defaultValue: true
    },

    aclContent: {
        type: Boolean,
        label: "Everyone can join",
        defaultValue: true
    }
};

Groups.attachSchema(new SimpleSchema([Group]));
