Notifications = new Mongo.Collection('notifications');

Notifications.allow({
    update: function (userId, doc, fieldNames) {
        return ownsDocument(userId, doc) &&
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
            publisher: entry.publisher,
            entryId: entry._id,
            commentId: comment._id,
            commenterName: comment.author,
            read: false
        });
    }
};