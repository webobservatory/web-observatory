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
    //make sure the listened doms are disjointed
    //if one listener remove the dom and the event propagates up will cause Uncaught Error: Must be attached
    'click .card-content': function (e, template) {
        //only dismiss notifications that do not need an action
        if (!template.data.actions) {
            Notifications.update(template.data._id, {$set: {read: true}});
        }
    },
    'click .card-action a': function (e, template) {
        //e.preventDefault();
        var $target = $(e.target),
            action = $target.attr('notification-action');

        //dismiss notification only if the action succeed
        if (actions[action](template.data)) {
            Notifications.update(template.data._id, {$set: {read: true}});
        }
    }
});

var actions = {
    Allow: function (notification) {
        //console.log(notification);
        var category;

        if (notification.category === 'dataset') {
            category = Datasets;
        }

        if (notification.category === 'app') {
            category = Apps;
        }

        var entry = category.update(notification.entryId, {$addToSet: {contentWhiteList: notification.initiatorId}});

        if (entry) {
            var path = Router.routes[notification.category + '.page'].path({_id: notification.entryId});
            var message = '<a href="' + path + '">Access granted</a>';
            Meteor.call('createNotification', Meteor.userId(), notification.entryId, notification.initiatorId, notification.category, message);
        }

        return !!entry;
    },
    Deny: function (notification) {
        //console.log(notification);
        var path = Router.routes[notification.category + '.page'].path({_id: notification.entryId});
        var message = '<a href="' + path + '">Access request declined</a>';
        Meteor.call('createNotification', Meteor.userId(), notification.entryId, notification.initiatorId, notification.category, message);
        return true;
    }
};

Template.notifications.rendered = function () {
    $(".dropdown-button").dropdown();
};
