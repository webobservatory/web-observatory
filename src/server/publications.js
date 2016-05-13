/*collection publication*/
function pubSingle(coll) {
    function cbFactry(coll) {
        return function (id, options = {}) {
            check(id, String);

            let selector = {_id: id},
                userId = this.userId;

            extendOr(selector, viewsDocumentQuery(userId));
            options.fields = {
                //'distribution.url': 0,
                'distribution.file': 0,
                'distribution.profile.username': 0,
                'distribution.profile.pass': 0,
            };

            return coll.find(selector, options);
        }
    }

    publish(coll, cbFactry, coll=>coll.singularName)
}

function pubPlural(coll) {
    function cbFactry(coll) {
        return function (options = {}, selector = {}) {
            //check(options, {
            //    fields: Match.Optional(Object),
            //    skip: Match.Optional(Object),
            //    sort: Match.Optional(Object),
            //    limit: Match.Optional(Number)
            //});
            if (!selector) {
                selector = {};
            }

            if (!options) {
                options = {};
            }

            check(selector, Object);

            switch (coll) {
                case Meteor.users:
                    options.fields = {username: 1};
                    break;

                case Datasets:
                    let userId = this.userId;
                    extendOr(selector, viewsDocumentQuery(userId));
                    options.fields = {
                        //'distribution.url': 0,
                        'distribution.file': 0,
                        'distribution.profile.username': 0,
                        'distribution.profile.pass': 0
                    };
                    Counts.publish(this, coll.singularName, coll.find(), {nonReactive: true});
                    break;

                case Apps:
                    userId = this.userId;
                    extendOr(selector, viewsDocumentQuery(userId));
                    Counts.publish(this, coll.singularName, coll.find(), {nonReactive: true});
                    break;
            }

            return coll.find(selector, options);
        };
    }

    publish(coll, cbFactry);
}

[Datasets, Apps, RemoteApps, RemoteDatasets, Groups].forEach(pubSingle);

[Datasets, Apps, Groups, Licenses, Meteor.users, RemoteApps, RemoteDatasets].forEach(pubPlural);

Meteor.publish('comments', function (entryId) {
    check(entryId, String);
    return Comments.find({entryId: entryId});
});

//publish({
//        countDatasets: Datasets,
//        countApps: Apps,
//        countGroups: Groups,
//}, Meteor.publish, function (collection) {
//    return function () {
//        Counts.publish(this, collection.singularName, collection.find());
//        //return collection.find();
//    }
//});

Meteor.publish('notifications', function () {
    return Notifications.find({userId: this.userId, read: false});
});

Meteor.publish('images', function () {
    return Images.find();
});

//Meteor.publish("datasetsAndApps", function () {
//    return [
//        Datasets.find(),
//        Apps.find()
//    ];
//});