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

function connectorFactory(connect) {
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
let mongodbConnect = connectorFactory(function (url, username, pass, done) {
    if (username) {
        url = `mongodb://${username}:${pass}@${url.slice('mongodb://'.length)}`;
    }
    mongoclient.connect(url, done);
});

/* MySQL */
let mysqlCon = Meteor.npmRequire('mysql');

let mysqlConnect = connectorFactory(function (url, username, pass, done) {
    let pool = mysqlCon.createPool({
        connectionLimit: 20,
        host: url,
        user: username,
        password: pass
    });
    done(null, pool);
});

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
    mongodbQuery: queryerFactory(mongodbConnect, (db, done, collection, selector = {}, options = {})=> {
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
        })
    }),
    mysqlQuery: queryerFactory(mysqlConnect, (db, done, query)=> {
        db.query(query, done);// db.query returns a third argument @fields which is discarded
    }),
    sparqlQuery: queryerFactory(connectorFactory((url, username, pass, done)=> {
        done(null, url);
    }), (db, done, query)=> {
        HTTP.get(db, {
            params: {query}, timeout: 30000, headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/sparql-results+json'
            }
        }, function (error, result) {
            if (typeof result === 'object' && result.content) {
                try {
                    result = result.content;
                } catch (e) {
                    console.log(e);
                }
            }
            done(error, result);
        });
    })
});

function queryerFactory(connector, queryExec) {
    return function (distId, ...args) {
        let db = dbPool[distId];

        if (!db) {
            connector(distId);
        }

        db = dbPool[distId];

        if (!db) {
            throw new Meteor.Error('not-found', `Distribution ${distId} not initialised`);
        }

        let {error, result} = Async.runSync(function (done) {
            queryExec(db, done, ...args);
        });

        if (error) {
            throw new Meteor.Error(error.name, error.message);
        } else {
            return result;
        }
    }
}
