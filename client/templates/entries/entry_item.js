Template.entryItem.helpers({
    blurb: function (text, limit) {
        var blurb = jQuery.truncate(text, {
            length: limit
        });
        return blurb
    },
    offline: function () {
        if (this.distribution) {
            return this.distribution.some(function (dist) {
                return !dist.online;
            });
        }
        return !this.online;
    },
    dataContex: function () {
        console.log(this);
    },
    ownEntry: function () {
        return this.publisher == Meteor.userId();
    },
    publisher: function () {
        return Meteor.users.findOne(this.publisher);
    },
    //domain: function () {
    //    var a = document.createElement('a');
    //    a.href = this.url;
    //    return a.hostname;
    //},
    upvotedClass: function () {
        var userId = Meteor.userId();
        if (userId && !_.include(this.upvoters, userId)) {
            return 'upvotable';
        } else {
            return 'disabled';
        }
    }
});

Template.entryItem.events({
    'click .upvotable': function (e) {
        e.preventDefault();
        Meteor.call('upvote', this._id, Template.parentData(1).category);
    }
});

Template.distribution.helpers({
    offlineClass: function () {
        if (this.online) {
            return "teal";
        } else {
            return "grey";
        }
    }
});
