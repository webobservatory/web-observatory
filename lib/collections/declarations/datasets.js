/**
 * Created by xgfd on 17/12/2015.
 */

Datasets = new orion.collection('datasets', {
    singularName: 'dataset', // The name of one of these items
    pluralName: 'datasets', // The name of more than one of these items
    link: {
        // *
        //  * The text that you want to show in the sidebar.
        //  * The default value is the name of the collection, so
        //  * in this case it is not necessary.

        title: 'Datasets'
    },
    /**
     * Tabular settings for this collection
     */
    tabular: {
        // here we set which data columns we want to appear on the data table
        // in the CMS panel
        columns: [
            {
                data: "_id",
                title: "ID"
            },
            {
                data: "name",
                title: "Name"
            },
            {
                data: "publisher",
                render: function (val, type, doc) {
                    var publisherId = val;
                    var publisherName = Meteor.users.findOne(publisherId).username;
                    return publisherName;
                },
                title: "Publisher"
            },
            orion.attributeColumn('createdAt', 'datePublished', 'Published'),
        ]
    }
});

Datasets.allow({
    update: function (userId, entry, fieldNames) {
        return ownsDocument(userId, entry) && _.difference(fieldNames, datasetWhitelist).length === 0;
    },
    remove: function (userId, entry) {
        return ownsDocument(userId, entry);
    },
});

//Datasets.deny({
//    update: function (userId, entry, fieldNames) {
//        return _.difference(fieldNames, datasetWhitelist).length !== 0;
//    }
//});

//Datasets.deny({
//    update: function (userId, entry, fieldNames, modifier) {
//        var errors = validateDataset(modifier.$set);
//        return errors.name || errors.distribution;
//    }
//});

validateDataset = function (dataset) {
    var errors = {};

    if (!dataset.name)
        errors.name = "Please fill in a name";

    if (!dataset.distribution)
        errors.distribution = "Please fill in a distribution";

    return errors;
}

Meteor.methods({
    datasetInsert: function (datasetAttributes) {
        check(this.userId, String);
        check(datasetAttributes, {
            name: String,
            //url: String
        });

        var errors = validateDataset(datasetAttributes);
        if (errors.name || errors.distribution)
            throw new Meteor.Error('invalid-dataset', "You must set a name and distribution for your dataset");

        //var datasetWithSameLink = Datasets.findOne({"distribution.url": datasetAttributes.distribution.url});
        //if (datasetWithSameLink) {
        //    return {
        //        postExists: true,
        //        _id: datasetWithSameLink._id
        //    }
        //}

        var user = Meteor.user();
        var dataset = _.extend(datasetAttributes, {
            publisher: user._id,
            commentsCount: 0,
            upvoters: [],
            votes: 0
        });

        var datasetId = Datasets.insert(dataset);

        return {
            _id: datasetId
        };
    },

    upvote: function (entryId, category) {
        check(this.userId, String);
        check(entryId, String);
        check(category, String);

        var affected, Collection;

        switch (category) {
            case 'dataset':
                Collection = Datasets;
                break;
            case 'app':
                Collection = Apps;
                break;
        }

        affected = Collection.update({
            _id: entryId,
            upvoters: {$ne: this.userId}
        }, {
            $addToSet: {upvoters: this.userId},
            $inc: {votes: 1}
        });

        if (!affected)
            throw new Meteor.Error('invalid', "You weren't able to upvote that entry");
    }
});
