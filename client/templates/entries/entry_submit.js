Template.entrySubmit.onCreated(function () {
    Session.set('entrySubmitErrors', {});
});

Template.entrySubmit.helpers({
    errorMessage: function (field) {
        return Session.get('entrySubmitErrors')[field];
    },
    errorClass: function (field) {
        return !!Session.get('entrySubmitErrors')[field] ? 'has-error' : '';
    }
});

Template.entrySubmit.onRendered(function () {

    // AutoForm.hooks({
    //   entrySubmitForm: hooksObject
    // });

});

// Template.entrySubmit.events({
//   'submit form': function(e) {
//     e.preventDefault();

//     var post = {
//       url: $(e.target).find('[name=url]').val(),
//       title: $(e.target).find('[name=title]').val()
//     };

//     var errors = validatePost(post);
//     if (errors.title || errors.url)
//       return Session.set('entrySubmitErrors', errors);

//     Meteor.call('postInsert', post, function(error, result) {
//       // display the error to the user and abort
//       if (error)
//         return throwError(error.reason);

//       // show this result but route anyway
//       if (result.postExists)
//         throwError('This link has already been posted');

//       Router.go('postPage', {_id: result._id});  
//     });
//   }
// });