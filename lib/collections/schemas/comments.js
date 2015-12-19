/**
 * Now we will attach the schema for that collection.
 * Orion will automatically create the corresponding form.
 */
Comments.attachSchema(new SimpleSchema({
    // here is where we define `a comment has one post`
    // Each document in Comment has a postId
    datasetId: orion.attribute('hasOne', {
        type: String,
        // the label is the text that will show up on the Update form's label
        label: 'About',
        // optional is false because you shouldn't have a comment without a post
        // associated with it
        optional: false,
        autoform: {
            type: "hidden",
            readonly: true
        }
    }, {
        // specify the collection you're making the relationship with
        collection: Datasets,
        // the key whose value you want to show for each Post document on the Update form
        titleField: 'name',
        // dunno
        publicationName: 'someRandomString',
    }),
    // here is where we define `a comment has one user (author)`
    // Each document in Comment has a userId
    userId: orion.attribute('hasOne', {
        type: String,
        label: 'Author',
        autoform: {
            type: "hidden",
            readonly: true
        },
        optional: false
    }, {
        collection: Meteor.users,
        // the key whose value you want to show for each Post document on the Update form
        titleField: 'username',
        publicationName: 'anotherRandomString',
    }),
    submitted: {
        type: Date,
        optional: false,
        autoform: {
            readonly: true
        }
    },
    body: orion.attribute('summernote', {
        label: 'Body'
    }),
    image: orion.attribute('image', {
        optional: true,
        label: 'Comment Image'
    }),
}));

