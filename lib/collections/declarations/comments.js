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
                data: "publisher",
                title: "Author",
                render: function (val, type, doc) {
                    let username = Meteor.users.findOne(val).username;
                    return username;
                }
            }, {
                data: "entryId",
                title: "Comment of",
                render: function (val, type, doc) {
                    let entryId = val;

                    //A comment can be of either a dataset or an app
                    let entryTitle = Datasets.findOne(entryId).name || Apps.findOne(entryId).name;
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
        check(category, Mongo.Collection);
        check(category.singularName, Match.OneOf('dataset', 'app'));
        check(commentAttributes, {
            entryId: String,
            body: String
        });

        entry = category.findOne(commentAttributes.entryId);

        if (!entry)
            throw new Meteor.Error('invalid-comment', 'You must comment on ' + category);

        comment = _.extend(commentAttributes, {
            publisher: this.userId,
            category: category.singularName,
            //author: user.username,
            submitted: new Date()
        });

        // update the post with the number of comments
        category.update(comment.entryId, {$inc: {commentsCount: 1}});

        // create the comment, save the id
        comment._id = Comments.insert(comment);

        // now create a notification, informing the user that there's been a comment
        createCommentNotification(comment, category);

        return comment._id;
    }
});

function createCommentNotification(comment, category) {
    check(comment, Object);
    check(category, Mongo.Collection);
    check(category.singularName, Match.OneOf('dataset', 'app'));

    let entryId = comment.entryId,
        entry = category.findOne(entryId),
        initiatorId = comment.publisher;

    let path = Router.routes[category.singularName + '.page'].path({_id: entryId});
    let message = '<a href="' + path + '"> <strong>' + Meteor.users.findOne(initiatorId).username + '</strong> commented on your post </a>';

    if (initiatorId !== entry.publisher) {
        createNotification(initiatorId, entryId, entry.name, entry.publisher, category.singularName, message);
    }
};
