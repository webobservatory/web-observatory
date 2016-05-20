/**
 * Created by xgfd on 12/05/2016.
 */
let remoteMeta = {
    origin: {
        type: String,
        label: 'Origin',
        optional: true
    }
};

let ReleasedCreativeWork = _.clone(CreativeWork);

ReleasedCreativeWork.publisher = {
    type: String,
    label: 'Publisher',
    optional: true,
    autoform: {type: 'hidden'}
};

ReleasedCreativeWork.description = {
    type: String,
    label: 'Description',
    optional: true,
    autoform: {type: 'textarea'}
};

ReleasedCreativeWork.metaWhiteList = {
    type: [String],
    label: 'Permitted to see',
    optional: true
};

ReleasedCreativeWork.contentWhiteList = {
    type: [String],
    label: 'Permitted to access',
    optional: true
};

RemoteApps.attachSchema(new SimpleSchema([remoteMeta, AppSchema, ReleasedCreativeWork]));
RemoteDatasets.attachSchema(new SimpleSchema([remoteMeta, DatasetSchema, ReleasedCreativeWork]));
