Notifications = new Mongo.Collection('notifications');

Notifications.allow({
    update: function (userId, doc, fieldNames) {
        return doc.userId === userId &&
            fieldNames.length === 1 && fieldNames[0] === 'read';
    }
});

createNotification = function (initiatorId, entryId, userId, category, message, actions = false) {
    check(initiatorId, String);
    check(entryId, String);
    check(userId, String);
    check(category, String);
    check(message, String);
    check(actions, Match.Any);

    if (initiatorId !== userId) {
        Notifications.insert({
            userId: userId,
            initiatorId: initiatorId,
            category: category,
            entryId: entryId,
            message: message,
            actions: actions,
            read: false
        });
    }
};

Meteor.methods({
    createNotification (initiatorId, entryId, userId, category, message, actions = false) {
        check(initiatorId, String);
        check(entryId, String);
        check(userId, String);
        check(category, String);
        check(message, String);
        check(actions, Match.Any);

        if (initiatorId !== userId) {
            Notifications.insert({
                userId: userId,
                initiatorId: initiatorId,
                category: category,
                entryId: entryId,
                message: message,
                actions: actions,
                read: false
            });
        }
    },
    createRequestNotification(username, organisation, initiatorId, entry, category)
    {
        check(username, String);
        check(organisation, String);
        check(initiatorId, String);
        check(entry, Object);
        check(category, String);

        var path = Router.routes[category + '.page'].path({_id: entry._id});

        var message = '<a href="' + path + '">'
                + '<strong>' + username + '</strong>'
                + (organisation ? ' of ' + '<strong>' + organisation + '</strong>' : '')
                + ' requested access to your '
                + category + ' ' + entry.name + ' </a>',
            actions = ['Allow', 'Deny'];

        createNotification(initiatorId, entry._id, entry.publisher, category, message, actions);
    }
});
