Meteor.publish('datasets', function (options) {
    check(options, {
        fields: Match.Optional(Object),
        sort: Object,
        limit: Number
    });
    return Datasets.find({}, options);
});

Meteor.publish('singleDataset', function (id) {
    check(id, String);
    return Datasets.find(id);
});

Meteor.publish('apps', function (options) {
    check(options, {
        fields: Match.Optional(Object),
        sort: Object,
        limit: Number
    });
    return Apps.find({}, options);
});

Meteor.publish('singleApp', function (id) {
    check(id, String);
    return Apps.find(id);
});

Meteor.publish('comments', function (entryId) {
    check(entryId, String);
    return Comments.find({entryId: entryId});
});

Meteor.publish('notifications', function () {
    return Notifications.find({userId: this.userId, read: false});
});

Meteor.publish("userNames", function (options) {
    check(options, {
        fields: Object,
        sort: Object,
        limit: Number
    });

    return Meteor.users.find({}, options);
});

Meteor.publish('images', function () {
    return Images.find();
});