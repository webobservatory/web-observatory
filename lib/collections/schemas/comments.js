/**
 * Now we will attach the schema for that collection.
 * Orion will automatically create the corresponding form.
 */
Comments.attachSchema(new SimpleSchema({
    entryId: {
        type: String,
        // the label is the text that will show up on the Update form's label
        label: 'Comment of',
        // optional is false because you shouldn't have a comment without a post
        // associated with it
        optional: false,
        autoform: {
            type: "hidden",
            readonly: true
        }
    },
    // here is where we define `a comment has one user (author)`
    // Each document in Comment has a userId
    userId: {
        type: String,
        label: 'Author',
        autoform: {
            type: "hidden",
            readonly: true
        },
        optional: false
    },
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
