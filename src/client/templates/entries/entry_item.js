let schemaOrg = 'http://schema.org/';

Template.entryItem.helpers({
    prettifyDate(timestamp) {
        return moment(new Date(timestamp)).fromNow();
    },
    //schema.org helpers
    itemtype() {
        let parentData = Template.parentData(1),
            category = parentData.category;

        switch (category) {
            case Datasets:
                return schemaOrg + 'Dataset';
            case Apps:
                return schemaOrg + 'Apps';
            case Groups:
                return schemaOrg + 'Groups';
        }
    },
    blurb(text, limit) {
        let blurb = jQuery.truncate(text, {
            length: limit
        });
        return blurb
    },
    offline() {
        if (Template.parentData().category.singularName === 'group') {
            return false;
        }

        if (this.distribution) {
            return this.distribution.some(function (dist) {
                return !dist.online;
            });
        }
        return !this.online;
    },
    ownEntry(entry = this) {
        return entry.publisher == Meteor.userId() || Roles.userHasRole(Meteor.userId(), "admin");
    },
    publisherName() {
        if (this.publisherName) {
            return this.publisherName;
        } else {
            let publisher = Meteor.users.findOne(this.publisher);
            return publisher ? publisher.username : '';
        }
    },
    absUrl() {
        let parentData = Template.parentData(1),
            category = parentData.category;

        let a = document.createElement('a');
        a.href = `/${category.pluralName}/${this._id}`;
        return a.host + a.pathname;
    },
    // showInNewTab() {
    //     //permitted to access
    //     if (accessesDocument(Meteor.userId(), this)) {
    //         // app, group
    //         if (this.url) {
    //             return this.url;
    //         }
    //         //dataset with only one html distribution
    //         if (this.distribution && this.distribution.length === 1 && this.distribution[0].fileFormat === 'HTML') {
    //             return this.distribution[0].url;
    //         }
    //     }
    // }
});

Template.entryItem.events({
    'click .upvotable'(e) {
        e.preventDefault();
        let parentData = Template.parentData(1);
        Meteor.call('upvote', this._id, parentData.category);
    },
    'click .downvotable'(e) {
        e.preventDefault();
        let parentData = Template.parentData(1);
        Meteor.call('downvote', this._id, parentData.category);
    }
});

Template.distribution.helpers({
    offlineClass() {
        if (this.online) {
            return "white-text";
        } else {
            return "grey-text";
        }
    }
});

Template.entryItem.rendered = function () {
    $('.tooltipped').tooltip({delay: 300});
};
