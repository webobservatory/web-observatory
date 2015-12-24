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
                data: "entryId",
                title: "Comment of",
                render: function (val, type, doc) {
                    var entryId = val;

                    //A comment can be of either a dataset or an app
                    var entryTitle = Datasets.findOne(entryId).name || Apps.findOne(entryId).name;
                    return entryTitle;
                }
            }, {
                data: "body",
                title: "Comment",
                tmpl: Meteor.isClient && Template.commentsIndexBlurbCell
            },
            orion.attributeColumn('createdAt', 'submitted', 'Submitted')
        ]
    },
});

//TODO add allow & deny rules

Meteor.methods({
    commentInsert: function (commentAttributes, category) {
        check(this.userId, String);
        check(category, Match.OneOf('dataset', 'app'));
        check(commentAttributes, {
            entryId: String,
            body: String
        });

        var Collection, entry;
        if (category === "dataset") {
            Collection = Datasets;
        }

        if (category === "app") {
            Collection = Apps;
        }

        if (Collection) {
            entry = Collection.findOne(commentAttributes.entryId);
        }

        if (!entry)
            throw new Meteor.Error('invalid-comment', 'You must comment on ' + category);

        comment = _.extend(commentAttributes, {
            publisher: this.userId,
            category: category,
            //author: user.username,
            submitted: new Date()
        });

        // update the post with the number of comments
        Collection.update(comment.entryId, {$inc: {commentsCount: 1}});

        // create the comment, save the id
        comment._id = Comments.insert(comment);

        // now create a notification, informing the user that there's been a comment
        createCommentNotification(comment, category);

        return comment._id;
    }
});
