/**
 * http://schema.org/Dataset
 * Created by xgfd on 17/12/2015.
 */

var DistributionSchema = new SimpleSchema({

    url: {
        type: String,
        label: 'Distribution URL',
        regEx: SimpleSchema.RegEx.Url
    },

    username: {
        type: String,
        optional: true
    },

    pass: {
        type: String,
        optional: true
    },

    fileFormat: {
        type: String,
        label: 'Format'
    }

});

var Dataset = {
    datasetTimeInterval: {
        type: Object,
        label: "Time span",
        optional: true
    },

    "datasetTimeInterval.startTime": {
        type: Date,
        label: "Start"
    },

    "datasetTimeInterval.endTime": {
        type: Date,
        label: "End"
    },

    distribution: {
        type: [DistributionSchema],
        label: "Distribution"
    },

    spatial: {
        type: String,
        label: "Spatial coverage",
        optional: true
    }
};

//_.extend(Dataset, CreativeWork);
//important, generate whitelist before constructing simpleschema
datasetWhitelist = _.filter(_.keys(Dataset), function (property) {
    return !Dataset[property].noneditable;
});
Datasets.attachSchema(new SimpleSchema([CreativeWork, Dataset]));
