Template.entryPage.helpers({
    appendHash(str) {
        return '#' + str;
    },
});
Template.entryPage.rendered = function () {
    $('ul.tabs').tabs();
};

SimpleSchema.messages({acceptTerms: 'You must accept the terms and conditions and privacy policy of this item'});

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

        var user = Meteor.user(),
            $target = $(e.target);

        var initiatorId = user._id,
            name = user.profile.name || $target.find('[name=name]').val(),
            username = user.username,
            email = user.email || $target.find('[name=email]').val(),
            organisation = $target.find('[name=organisation]').val(),
            acceptTerms = $target.find('[name=acceptTerms]').prop('checked');

        if (initiatorId && acceptTerms) {
            Meteor.call('createRequestNotification', username, organisation, initiatorId, template.data.entry, template.data.category.singularName);
            alert("Request sent");
        }
    }
});

