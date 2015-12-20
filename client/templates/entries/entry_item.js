Template.entryItem.helpers({
    dataContex: function() {
        console.log(this);
    },
    ownEntry: function () {
        return this.publisher == Meteor.userId();
    },
    publisher: function () {
        return Meteor.users.findOne(this.publisher);
    },
    domain: function () {
        var a = document.createElement('a');
        a.href = this.url;
        return a.hostname;
    },
    upvotedClass: function () {
        var userId = Meteor.userId();
        if (userId && !_.include(this.upvoters, userId)) {
            return 'btn-primary upvotable';
        } else {
            return 'disabled';
        }
    }
});

Template.entryItem.events({
    'click .upvotable': function (e) {
        e.preventDefault();
        Meteor.call('upvote', this._id, this.category);
    }
});