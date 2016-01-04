/**
 * Created by xgfd on 02/01/2016.
 */

let mongodb = {};

function mongodbConnect(url, username, pass) {
    let originUrl = url;

    if (arguments.length === 1) {
        if (url.indexOf('mongodb://') !== 0) {
            let distId = url,
                dist = Datasets.findOne({'distribution._id': distId}, {fields: {distribution: {$elemMatch: {_id: distId}}}}).distribution[0];

            //console.log(dist);

            if (dist) {
                ({url, username, pass} = dist);
            } else {
                throw new Meteor.Error('not-found', `Distribution ${distId} not found`);
            }
        }
    }

    if (username) {
        url = `mongodb://${username}:${pass}@${url.slice('mongodb://'.length)}`;
    }

    //don't need reactivity here, use native driver
    let mongoclient = Meteor.npmRequire("mongodb").MongoClient;//TODO use Npm.depends and Npm.require instead?

    let {error, result:db} = Async.runSync(function (done) {
        mongoclient.connect(url, done);
    });

    if (error) {
        throw new Meteor.Error(error.name, error.message);
    } else {
        mongodb[originUrl] = db;
        return true;
    }
}

Meteor.methods({
    mongodbConnect,
    mongodbCollectionNames(distId){
        let db = mongodb[distId];

        if (!db) {
            mongodbConnect(distId);
        }

        db = mongodb[distId];

        if (!db) {
            throw new Meteor.Error('not-found', `Distribution ${distId} not initialised`);
        }

        let {error, result} = Async.runSync(function (done) {
            db.listCollections().toArray(done);
        });

        if (error) {
            throw new Meteor.Error(error.name, error.message);
        } else {
            result = result.filter(function (x) {
                return x.name !== 'system.indexes'
            });
            //console.log(result);
            return result;
        }
    },
    mongodbQuery(distId, collection, selector = {}, options = {}){
        let db = mongodb[distId];

        if (!db) {
            mongodbConnect(distId);
        }

        db = mongodb[distId];

        if (!db) {
            throw new Meteor.Error('not-found', `Distribution ${distId} not initialised`);
        }

        let {error, result} = Async.runSync(function (done) {
            db.collection(collection, function (error, col) {
                if (error) {
                    throw new Meteor.Error(error.name, error.message);
                }
                //console.log(col);
                let query = col.find(selector);

                for (let key in options) {
                    if (options.hasOwnProperty(key)) {
                        query = query[key](options[key]);
                    }
                }

                let stream = query.stream({transform: JSON.stringify});//transform doesn't work somehow

                done(null, stream);
                //query.toArray(done);
            });
        });

        //console.log(result);

        if (error) {
            throw new Meteor.Error(error.name, error.message);
        } else {
            return result;
        }
    }
});
