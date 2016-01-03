/**
 * Created by xgfd on 24/12/2015.
 */

Groups = new orion.collection('groups', {
    singularName: 'group', // The name of one of these items
    pluralName: 'groups', // The name of more than one of these items
    link: {
        // *
        //  * The text that you want to show in the sidebar.
        //  * The default value is the name of the collection, so
        //  * in this case it is not necessary.

        title: 'Groups/Organisations'
    },
    /**
     * Tabular settings for this collection
     */
    tabular: {
        // here we set which data columns we want to appear on the data table
        // in the CMS panel
        columns: [
            {
                data: "name",
                title: "Name"
            },
            {
                data: "publisher",
                title: "Founder",
                render: function (val, type, doc) {
                    let publisherName = Meteor.users.findOne(val).username;
                    return publisherName;
                },
            },
            {
                data: "members",
                title: "Members",
                render: function (val, type, doc) {
                    if (!val) {
                        return 'No member';
                    }

                    let memberIds = val,
                        query = {$or: []};
                    memberIds.reduce(function (previous, id) {
                        return query.$or.push({_id: id});
                    }, query);

                    return Meteor.users.find(query).map(function (user) {
                        return user.username;
                    });
                }
            },
            orion.attributeColumn('createdAt', 'datePublished', 'Created'),
        ]
    }
});

Meteor.methods({
    addToGroup: function (userId, groupId) {
        check(userId, String);
        check(groupId, String);
        Groups.update(groupId, {$addToSet: {members: userId}});
    },
    removeFromGroup: function (userId, groupId) {
        check(userId, String);
        check(groupId, String);
        Groups.update(groupId, {$pull: {members: userId}});
    }
});
