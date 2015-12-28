Template.notifications.helpers({
    notifications: function () {
        return Notifications.find({userId: Meteor.userId(), read: false});
    },
    notificationCount: function () {
        return Notifications.find({userId: Meteor.userId(), read: false}).count();
    }
});

Template.notificationItem.helpers({
    notificationPostPath: function () {
        return Router.routes[this.category + '.page'].path({_id: this.entryId});
    }
});

Template.notificationItem.events({
    'click a': function () {
        Notifications.update(this._id, {$set: {read: true}});
    }
});

Template.notifications.rendered = function () {
    $(".dropdown-button").dropdown();
};
