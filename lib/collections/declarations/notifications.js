Notifications = new Mongo.Collection('notifications');

Notifications.allow({
    update: function (userId, doc, fieldNames) {
        return doc.userId === userId &&
            fieldNames.length === 1 && fieldNames[0] === 'read';
    }
});

createNotification = function (initiatorId, entryId, entryName, userId, category, message, actions = false) {
    check(initiatorId, String);
    check(entryId, String);
    check(entryName, String);
    check(userId, String);
    check(category, String);
    check(message, String);
    check(actions, Match.Any);

    if (initiatorId !== userId) {
        Notifications.update({
            userId,
            initiatorId,
            category,
            entryId,
            entryName,
            message,
            actions,
            read: false
        }, {
            $set: {
                userId,
                initiatorId,
                category,
                entryId,
                entryName,
                message,
                actions,
                read: false
            }
        }, {upsert: true});
    }
};

Meteor.methods({
    createNotification,
    createRequestNotification(username, organisation, initiatorId, entry, category) {
        check(username, String);
        check(organisation, String);
        check(initiatorId, String);
        check(entry, Object);
        check(category, String);

        var path = Router.routes[category + '.page'].path({_id: entry._id});

        var message = `<a href="${path}">`
                + `<strong>${username}</strong>`
                + (organisation ? ' of ' + '<strong>' + organisation + '</strong>' : '')
                + ' requested access to your '
                + `${category} ${entry.name}</a>`,
            actions = ['Allow', 'Deny'];

        createNotification(initiatorId, entry._id, entry.name, entry.publisher, category, message, actions);
    }
});
