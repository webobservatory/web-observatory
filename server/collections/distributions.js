/**
 * Created by xgfd on 02/01/2016.
 */
let dbPool = {};

function augsTrans(url, username, pass) {

    if (arguments.length === 1) {
        if (!url.match(/^.*:\/\//)) {
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

    return {url, username, pass};
}

function connectorGen(connect) {
    return function (url, username, pass) {
        let originUrl = url;

        ({url, username, pass} = augsTrans.apply(null, arguments));

        let {error, result} = Async.runSync(function (done) {
            connect(url, username, pass, done);
        });

        if (error) {
            throw new Meteor.Error(error.name, error.message);
        } else {
            dbPool[originUrl] = result;
            return true;
        }
    }
}

//TODO deconstruct connections using settimeout
/*MongoDB*/
let mongoclient = Meteor.npmRequire("mongodb").MongoClient;//TODO use Npm.depends and Npm.require instead?

/*
 call with one parameter @distId or three parameters @url @username @pass
 */
let mongodbConnect = connectorGen(function (url, username, pass, done) {
    if (username) {
        url = `mongodb://${username}:${pass}@${url.slice('mongodb://'.length)}`;
    }
    mongoclient.connect(url, done);
});

/* MySQL */
let mysqlCon = Meteor.npmRequire('mysql');

let mysqlConnect = connectorGen(function (url, username, pass, done) {
    let pool = mysqlCon.createPool({
        connectionLimit: 20,
        host: url,
        user: username,
        password: pass
    });
    done(null, pool);
});

//function mysqlConnect(url, username, pass) {
//
//    let originUrl = url;
//
//    ({url, username, pass} = augsTrans.apply(null, arguments));
//
//
//    let {error, result} = Async.runSync(function (done) {
//        let pool = mysqlCon.createPool({
//            connectionLimit: 20,
//            host: url,
//            user: username,
//            password: pass
//        });
//        pool.getConnection(done);
//    });
//
//    if (error) {
//        throw new Meteor.Error(error.name, error.message);
//    } else {
//        mysql[originUrl] = result;
//        return true;
//    }
//}

Meteor.methods({
    //connect
    mongodbConnect,
    mysqlConnect,
    //utils
    mongodbCollectionNames(distId){
        let db = dbPool[distId];

        if (!db) {
            mongodbConnect(distId);
        }

        db = dbPool[distId];

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
    //query
    mongodbQuery(distId, collection, selector = {}, options = {}){
        let db = dbPool[distId];

        if (!db) {
            mongodbConnect(distId);
        }

        db = dbPool[distId];

        if (!db) {
            throw new Meteor.Error('not-found', `Distribution ${distId} not initialised`);
        }

        let {error, result} = Async.runSync(function (done) {
            db.collection(collection, function (error, col) {
                if (error) {
                    throw new Meteor.Error(error.name, error.message);
                }
                let query = col.find(selector);

                for (let key in options) {
                    if (options.hasOwnProperty(key)) {
                        query = query[key](options[key]);
                    }
                }

                query.toArray(done);
            });
        });

        if (error) {
            throw new Meteor.Error(error.name, error.message);
        } else {
            return result;
        }
    },
    mysqlQuery(distId, query){
        let db = dbPool[distId];

        if (!db) {
            mysqlConnect(distId);
        }

        db = dbPool[distId];

        if (!db) {
            throw new Meteor.Error('not-found', `Distribution ${distId} not initialised`);
        }

        let {error, result} = Async.runSync(function (done) {
            db.query(query, done);// db.query returns a third argument @fields which is discarded
        });

        if (error) {
            throw new Meteor.Error(error.name, error.message);
        } else {
            return result;
        }
    }
});
