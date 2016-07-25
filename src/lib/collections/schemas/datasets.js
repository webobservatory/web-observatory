/**
 * http://schema.org/Dataset
 * Created by xgfd on 17/12/2015.
 */


let DistributionSchema = new SimpleSchema({

    _id: {
        type: String,
        denyUpdate: true,
        optional: true,
        regEx: SimpleSchema.RegEx.Id,
        autoValue() {
            console.log('subId', this);
            if (this.isInsert) {
                return Random.id();
            } else if (this.isUpsert) {
                return {$setOnInsert: Random.id()};
            } else {
                this.unset();  // Prevent user from supplying their own value
            }
        }
        // defaultValue: Random.id(),
        // autoform: {
        //     type: 'hidden',
        //     // readonly: true
        //     // omit: true
        // }
    },

    fileFormat: {
        type: String,
        label: 'Format',
        allowedValues: ['MongoDB', 'MySQL', 'AMQP', 'SPARQL', 'HTML', 'File', 'GeoData'],
        autoform: {type: 'select'}
        //TODO custom validate
    },

    url: {
        type: String,
        label: 'Distribution URL',
        autoform: {
            type: 'url',
            placeholder: "Select a format"
        }
    },

    file: orion.attribute('file', {
        label: 'Upload dataset as a file.',
        optional: true
    }),

    //dataset dependent information
    profile: {
        type: Object,
        optional: true,
        defaultValue: {}
    },
    //dataset username
    'profile.username': {
        type: String,
        optional: true,
        label: 'Dataset user name'
    },
    //dataset password
    'profile.pass': {
        type: String,
        optional: true,
        label: 'Dataset password'
    },
    //geo data source id in case of geo data
    'profile.geodata': {
        type: String,
        autoform: {
            type: 'hidden',
            // omit: true,
        },
        optional: true,
        label: 'GeoData Id'
    },

    instruction: {
        type: String,
        optional: true,
        label: 'Instruction to access this dataset',
        autoform: {type: 'textarea'}
    },

    //whether this distribution is online
    online: {
        type: Boolean,
        autoform: {
            omit: true
        },
        optional: true,
        defaultValue: true
    }
});

DatasetSchema = {

    url: {
        type: String,
        label: "URL",
        regEx: SimpleSchema.RegEx.Url,
        autoform: {
            type: 'hidden'
        },
        optional: true,
        autoValue() {
            if (!this.isSet) {
                let distribution = this.field('distribution').value;
                if (distribution && distribution.length === 1 && distribution[0].fileFormat === 'HTML') {
                    return distribution[0].url;
                }
            }
        }
    },

    distribution: {
        type: [DistributionSchema],
        autoValue(){
            if(this.isUpdate) {
                this.unset();
            }
            // return setAtCreation(this, undefined);
        },
        label: "Distribution"
    },

    datasetTimeInterval: {
        type: Object,
        label: "Time span",
        optional: true
    },

    "datasetTimeInterval.startTime": {
        type: Date,
        label: "Start",
        autoform: {
            type: "bootstrap-datepicker" // set to bootstrap-datepicker to work with materilize, check out https://github.com/djhi/meteor-autoform-materialize/
        }
    },

    "datasetTimeInterval.endTime": {
        type: Date,
        label: "End",
        autoform: {
            type: "bootstrap-datepicker"
        }
    },

    spatial: {
        type: String,
        label: "Spatial coverage",
        optional: true
    }
};

//_.extend(Dataset, CreativeWork);
//important, generate whitelist before constructing simpleschema
//datasetWhitelist = _.filter(_.keys(Dataset), function (property) {
//    return !Dataset[property].noneditable;
//});
//
//_.extend(datasetWhitelist, Whitelist);
//
//datasetBlackList = _.filter(_.keys(Dataset), function (property) {
//    return Dataset[property].noneditable;
//});
//
//_.extend(datasetBlackList, BlackList);

/* the following will cause errors;
 * new SimpleSchema(Dataset)) modifies Dataset and therefore modifies CreativeWork
 _.extend(Dataset, CreativeWork);
 Datasets.attachSchema(new SimpleSchema(Dataset));
 */
Datasets.attachSchema(new SimpleSchema([Thing, DatasetSchema, CreativeWork]));
