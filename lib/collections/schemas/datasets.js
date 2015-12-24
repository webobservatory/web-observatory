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
    },
    //whether this distribution is online
    online: {
        type: Boolean,
        noneditable: true,
        autoform: {
            readonly: true,
        },
        defaultValue: true
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

_.extend(datasetWhitelist, Whitelist);

datasetBlackList = _.filter(_.keys(Dataset), function (property) {
    return Dataset[property].noneditable;
});

_.extend(datasetBlackList, BlackList);

/* the following will cause errors;
 * new SimpleSchema(Dataset)) modifies Dataset and therefore modifies CreativeWork
 _.extend(Dataset, CreativeWork);
 Datasets.attachSchema(new SimpleSchema(Dataset));
 */
Datasets.attachSchema(new SimpleSchema([CreativeWork, Dataset]));
