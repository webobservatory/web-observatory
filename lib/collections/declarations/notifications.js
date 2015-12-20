Notifications = new Mongo.Collection('notifications');

Notifications.allow({
  update: function(userId, doc, fieldNames) {
    return ownsDocument(userId, doc) && 
      fieldNames.length === 1 && fieldNames[0] === 'read';
  }
});

createCommentNotification = function(comment) {
  var dataset = Datasets.findOne(comment.entryId);
  if (comment.userId !== dataset.userId) {
    Notifications.insert({
      userId: dataset.publisher,
      entryId: dataset._id,
      commentId: comment._id,
      commenterName: comment.author,
      read: false
    });
  }
};