/**
 * Created by xgfd on 01/01/2016.
 */

//register new message of type 'acceptTerms'
SimpleSchema.messages({acceptTerms: 'You must accept the terms and conditions of this item'});

Template.requestFrom.rendered = function () {
    $('.collapsible').collapsible({
        accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
    });
};

Template.requestFrom.helpers({
    requestSchema(){
        return new SimpleSchema({
            name: {type: String, label: 'Name', autoform: {readonly: true}},
            username: {
                type: String,
                label: 'Username',
                autoform: {readonly: true}
            },
            email: {
                type: String,
                autoform: {readonly: true}
            },
            organisation: {type: String, label: 'Organisation', optional: true},
            acceptTerms: {
                type: Boolean,
                optional: true,
                label: 'Accept the license of this item',
                custom: function () {
                    if (!this.value) {
                        return "acceptTerms";
                    }
                }
            }
        });
    }
});

Template.requestFrom.events({
    'submit form': function (e, template) {
        e.preventDefault();

        let user = Meteor.user(),
            $target = $(e.target);

        let initiatorId = user._id,
            name = user.profile.name || $target.find('[name=name]').val(),
            username = user.username,
            email = user.email || $target.find('[name=email]').val(),
            organisation = $target.find('[name=organisation]').val(),
            acceptTerms = $target.find('[name=acceptTerms]').prop('checked');

        if (initiatorId && acceptTerms) {
            Meteor.call('createRequestNotification', username, organisation, initiatorId, template.data.entry, template.data.category.singularName);
            //alert("Request sent");
            // Materialize.toast(message, displayLength, className, completeCallback);
            Materialize.toast('Request sent!', 4000) // 4000 is the duration of the toast
        }
    }
});

/*
 MongoDB functions
 */

let mongoDep;
Template.MongoDB.helpers({
        getCollectionNames() {
            Meteor.call('mongodbConnect', this._id);
            let collectionNames = ReactiveMethod.call('mongodbCollectionNames', this._id);
            //console.log(collectionNames);
            //change mongoDep after this function return
            Meteor.defer(function () {
                mongoDep.changed(); //feels like coding in Java
            });
            return collectionNames;
        }
    }
);

Template.MongoDB.onCreated(function () {
    mongoDep = new Tracker.Dependency();
});

Template.MongoDB.onRendered(function () {
    //only run at the first time it's rendered, by when collection names are not ready yet
    //use autorun and Tracker.Dependency to sync with getCollectionNames
    //ugly solution
    this.autorun(function () {
        mongoDep.depend();
        $('#collection').material_select();
    });
});
