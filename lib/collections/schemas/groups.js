/**
 * Created by xgfd on 24/12/2015.
 */

let Group = {
    name: {type: String},

    description: {type: String, optional: true},

    url: {type: String, regEx: SimpleSchema.RegEx.Url, optional: true, autoform: {type: 'url'}},

    youtube: {type: String, regEx: SimpleSchema.RegEx.Url, optional: true, autoform: {type: 'url'}},

    github: {type: String, regEx: SimpleSchema.RegEx.Url, optional: true, autoform: {type: 'url'}},

    publisher: orion.attribute('hasOne', {
        type: String,
        label: 'Founder',
    }, {
        collection: Meteor.users,
        titleField: 'username',
        publicationName: 'groupfounder'
    }),

    members: orion.attribute('hasMany', {
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
        label: 'Members',
        // optional is true because you can have a post without comments
        optional: true
    }, {
        collection: Apps,
        titleField: 'name',
        publicationName: 'groupapps'
    }),

    publications: {type: [Object], label: "Publications", optional: true},
    "publications.$.name": {type: String},
    "publications.$.url": {type: String},

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
        }
    },

    aclMeta: {
        type: Boolean,
        label: "Visible to everyone",
        defaultValue: true
    }
};

Groups.attachSchema(new SimpleSchema(Group));
