Comments = new orion.collection('comments', {
    singularName: 'comment', // The name of one of these items
    pluralName: 'comments', // The name of more than one of these items
    link: {
        // *
        //  * The text that you want to show in the sidebar.
        //  * The default value is the name of the collection, so
        //  * in this case it is not necessary.

        title: 'Comments'
    },
    /**
     * Tabular settings for this collection
     */
    tabular: {
        // here we set which data columns we want to appear on the data table
        // in the CMS panel
        columns: [
            {
                data: "userId",
                title: "Author",
                render: function (val, type, doc) {
                    var userId = val;
                    var username = Meteor.users.findOne(userId).username;
                    return username;
                }
            }, {
                data: "datasetId",
                title: "Comment of",
                render: function (val, type, doc) {
                    var entryId = val;
                    var entryTitle = Datasets.findOne(entryId).name;
                    return entryTitle;
                }
            }, {
                data: "body",
                title: "Comment",
                tmpl: Meteor.isClient && Template.commentsIndexBlurbCell
            },
            orion.attributeColumn('createdAt', 'submitted', 'Submitted'),
        ]
    },
});

//TODO add allow & deny rules

Meteor.methods({
    commentInsert: function (commentAttributes) {
        check(this.userId, String);
        check(commentAttributes, {
            datasetId: String,
            body: String
        });

        var user = Meteor.user();
        var post = Datasets.findOne(commentAttributes.datasetId);

        if (!post)
            throw new Meteor.Error('invalid-comment', 'You must comment on a post');

        comment = _.extend(commentAttributes, {
            userId: user._id,
            author: user.username,
            submitted: new Date()
        });

        // update the post with the number of comments
        Datasets.update(comment.datasetId, {$inc: {commentsCount: 1}});

        // create the comment, save the id
        comment._id = Comments.insert(comment);

        // now create a notification, informing the user that there's been a comment
        createCommentNotification(comment);

        return comment._id;
    }
});
