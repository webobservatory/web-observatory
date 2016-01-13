/*SearchSource publication*/
publish({dataset: Datasets, app: Apps, group: Groups}, SearchSource.defineSource, function (collection) {
    return function (searchText, options) {
        if (!options) {
            options = {
                options: {sort: {vote: -1}, limit: 12},
                selector: {},
                userId: null
            };
        }

        let selector = options.selector;

        if (searchText) {
            let regExp = buildRegExp(searchText);
            extendOr(selector, {$or: [{name: regExp}, {description: regExp}]});
        }

        let userId = options.userId || this.userId;
        extendOr(selector, viewsDocumentQuery(userId));

        return collection.find(selector, options.options).fetch();
    };
});

//any position
function buildRegExp(searchText) {
    let parts = searchText.trim().split(/[ \-\:]+/);
    return new RegExp("(" + parts.join('|') + ")", "ig");
}

//type ahead
//function buildRegExp(searchText) {
//    let words = searchText.trim().split(/[ \-\:]+/);
//    let exps = _.map(words, function (word) {
//        return "(?=.*" + word + ")";
//    });
//    let fullExp = exps.join('') + ".+";
//    return new RegExp(fullExp, "i");
//}

/*collection publication*/
publish({
    datasets: Datasets,
    apps: Apps,
    groups: Groups,
    userNames: Meteor.users
}, Meteor.publish, function (collection) {
    return function (options = {}, selector = {}) {
        check(options, {
            fields: Match.Optional(Object),
            skip: Match.Optional(Object),
            sort: Match.Optional(Object),
            limit: Match.Optional(Number)
        });

        check(selector, Object);

        if (collection !== Meteor.users) {
            let userId = options.userId || this.userId;
            extendOr(selector, viewsDocumentQuery(userId));
        } else {
            options.fields = {username: 1};
        }

        return collection.find(selector, options);
    };
});

publish({singleDataset: Datasets, singleApp: Apps, singleGroup: Groups}, Meteor.publish, function (collection) {
    return function (id, options = {}) {
        check(id, String);

        let selector = {_id: id},
            userId = this.userId;

        extendOr(selector, viewsDocumentQuery(userId));

        return collection.find(selector, options);
    }
});

Meteor.publish('comments', function (entryId) {
    check(entryId, String);
    return Comments.find({entryId: entryId});
});

Meteor.publish('notifications', function () {
    return Notifications.find({userId: this.userId, read: false});
});

Meteor.publish('images', function () {
    return Images.find();
});