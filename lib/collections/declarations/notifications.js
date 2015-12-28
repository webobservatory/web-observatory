Notifications = new Mongo.Collection('notifications');

Notifications.allow({
    update: function (userId, doc, fieldNames) {
        return doc.userId === userId &&
            fieldNames.length === 1 && fieldNames[0] === 'read';
    }
});

createCommentNotification = function (comment, category) {
    check(comment, Object);
    check(category, Mongo.Collection);
    check(category.singularName, Match.OneOf('dataset', 'app'));

    var entry = category.findOne(comment.entryId);

    if (comment.publisher !== entry.publisher) {
        Notifications.insert({
            userId: entry.publisher,
            category: category.singularName,
            entryId: entry._id,
            commentId: comment._id,
            commenterName: Meteor.users.findOne(comment.publisher).username,
            read: false
        });
    }
};