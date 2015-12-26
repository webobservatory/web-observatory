/**
 * Created by xgfd on 26/12/2015.
 */

Meteor.methods({
    //datasetInsert: function (datasetAttributes) {
    //    check(this.userId, String);
    //    check(datasetAttributes, {
    //        name: String,
    //        //url: String
    //    });
    //
    //    var errors = validateDataset(datasetAttributes);
    //    if (errors.name || errors.distribution)
    //        throw new Meteor.Error('invalid-dataset', "You must set a name and distribution for your dataset");
    //
    //    //var datasetWithSameLink = Datasets.findOne({"distribution.url": datasetAttributes.distribution.url});
    //    //if (datasetWithSameLink) {
    //    //    return {
    //    //        postExists: true,
    //    //        _id: datasetWithSameLink._id
    //    //    }
    //    //}
    //
    //    var user = Meteor.user();
    //    var dataset = _.extend(datasetAttributes, {
    //        publisher: user._id,
    //        commentsCount: 0,
    //        upvoters: [],
    //        votes: 0
    //    });
    //
    //    var datasetId = Datasets.insert(dataset);
    //
    //    return {
    //        _id: datasetId
    //    };
    //},

    upvote: function (entryId, category) {
        check(this.userId, String);
        check(entryId, String);
        check(category, Mongo.Collection);
        check(category.singularName, Match.OneOf('dataset', 'app'));

        var affected = category.update({
            _id: entryId,
            upvoters: {$ne: this.userId}
        }, {
            $addToSet: {upvoters: this.userId},
            $inc: {votes: 1}
        });

        if (!affected)
            throw new Meteor.Error('invalid', "You weren't able to upvote that entry");
    },

    grantMeta:function(userId, entryId, col){

    },
});
