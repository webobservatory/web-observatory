/**
 * Created by xgfd on 02/01/2016.
 */

let connPool = {};

function idToURL(distId) {
    let url, username, pass;

    let dist = Datasets.findOne({'distribution._id': distId}, {fields: {distribution: {$elemMatch: {_id: distId}}}}).distribution[0];

    if (dist) {
        url = dist.url;
        if (dist.profile) {
            ({username, pass} = dist.profile);
        }
    } else {
        console.log(new Meteor.Error('not-found', `Distribution ${distId} not found`));
    }

    return {url, username, pass};
}

function connectorSyncWrap(connect) {
    return function (id) {

        ({url, username, pass} = idToURL(id));

        let {error, result} = Async.runSync(function (done) {
            connect(url, username, pass, done);
        });

        if (error) {
            Datasets.update({"distribution._id": id}, {$set: {'distribution.$.online': false}});
            console.log(new Meteor.Error('connection-failed', `Distribution ${id}: ${error.message}`));
        } else {
            Datasets.update({"distribution._id": id}, {$set: {'distribution.$.online': true}});
            //add connection to pool
            connPool[id] = result;
            //remove connection after a while
            Meteor.setTimeout(function () {
                // console.log('close', id);
                let conn = connPool[id];

                if (conn) {
                    if (conn.close) {
                        conn.close();
                    }

                    if (conn.disconnect) {
                        conn.disconnect();
                    }

                    delete connPool[id];
                }
            }, 30000);
            return true;
        }
    }
}

/*
 * @connector(distId) create an db connection and save it to dbPool
 * @queryExec(db, done, ...args) query execution function. result is passed to done(error, result)
 * */
function queryExecFactory(connector, queryExec) {
    return function (distId, ...args) {
        let conn = connPool[distId];

        try {
            connector(distId);
            conn = connPool[distId];

            let {error, result} = Async.runSync(function (done) {
                queryExec(conn, done, ...args);
            });

            if (error) {
                throw new Meteor.Error(error.name, error.message);
            } else {
                Datasets.update({"distribution._id": distId}, {$set: {'distribution.$.online': true}});
                return result;
            }
        }
        catch (e) {
            Datasets.update({"distribution._id": distId}, {$set: {'distribution.$.online': false}});
            throw e;
        }

    }
}

/*
 * check whether credentials are included in the url
 */
function hasCredential(url) {
    let match = url.match(/(.*?:\/\/)?(.*:.*@).*/);
    return match && match[2];
}

/*MongoDB*/
let mongoclient = Npm.require("mongodb").MongoClient;

/*
 call with one parameter @distId or three parameters @url @username @pass
 */
let mongodbConnect = connectorSyncWrap(function (url, username, pass, done) {
    if (!hasCredential(url) && username) {
        url = `mongodb://${username}:${pass}@${url.slice('mongodb://'.length)}`;
    }
    mongoclient.connect(url, done);
});

let mongodbQuery = queryExecFactory(mongodbConnect, (conn, done, collection, selector = {}, options = {limit: 1000})=> {
    conn.collection(collection, function (error, col) {
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
});

/* MySQL */
let mysql = Npm.require('mysql');

function parseMySQL(url) {
    url = url.match(/(mysql:\/\/)?(.*)/)[2];//strip off mysql://
    let pathSepIndx = url.indexOf('/');
    let host, database;
    if (pathSepIndx !== -1) {
        host = url.substring(0, pathSepIndx),
            database = url.substring(pathSepIndx + 1);
    } else {
        host = url;
    }

    return {host, database};
}

let mysqlConnect = connectorSyncWrap(function (url, username, pass, done) {
    url = url.match(/(mysql:\/\/)?(.*)/)[2];//strip off mysql://
    let {host, database} = parseMySQL(url);

    let options = {
        connectionLimit: 20,
        host,
        database
    };

    if (username) {
        options.user = username;
    }

    if (pass) {
        options.password = pass;
    }

    let pool = mysql.createPool(options);

    done(null, pool);
});

let mysqlQuery = queryExecFactory(mysqlConnect, (conn, done, query)=> {
    conn.query(query, done);// db.query returns a third argument @fields which is discarded
});

/* PostgreSQL */
const { Pool } = Npm.require('pg');

function parsePostgreSQL(url) {
    url = url.match(/(postgresql:\/\/)?(.*)/)[2];//strip off postgresql://
    let pathSepIndx = url.indexOf('/');
    let host, database;
    if (pathSepIndx !== -1) {
        host = url.substring(0, pathSepIndx),
            database = url.substring(pathSepIndx + 1);
    } else {
        host = url;
    }

    return {host, database};
}

let pgConnect = connectorSyncWrap(function (url, username, pass, done) {
    url = url.match(/(postgresql:\/\/)?(.*)/)[2];//strip off postgresql://
    let {host, database} = parsePostgreSQL(url);

    let options = {
        connectionLimit: 20,
        host: host,
        database: database,
        ssl: false
    };

    if (username) {
        options.user = username;
    }

    if (pass) {
        options.password = pass;
    }

    const pool = new Pool(options);

    done(null, pool);
});

let pgQuery = queryExecFactory(pgConnect, (conn, done, query)=> {
    conn.query(query, done);// db.query returns a third argument @fields which is discarded
});

// SPARQL

let sparqlConnect = connectorSyncWrap((url, _, __, done)=> {
    HTTP.get(url, {}, (error, _)=> {
        done(error, url);
    });
});

let sparqlQuery = queryExecFactory(sparqlConnect, (url, done, query)=> {
    HTTP.get(url, {
            params: {query},
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/sparql-results+json'
            }
        },
        function (error, result) {
            if (typeof result === 'object' && result.content) {
                result = result.content;
            }
            done(error, result);
        });
});

/*RabbitMQ*/
let amqp = Npm.require('amqplib/callback_api');
let amqpConnect = connectorSyncWrap(function (url, username, pass, done) {
    let parts = url.match(/(amqps?:\/\/)?([^\?]*)\??(\S*)/),
        query = parts[3],
        params = query.split(/[=,&]/),
        exchanges = params[params.indexOf('exchange') + 1].split(',');//value of query exchange can be a comma separate list

    if (username) {
        url = parts[1] + `${username}:${pass}@` + parts[2] + (query ? `?${query}` : '');
    }

    amqp.connect(url, function (error, conn) {
        if (conn) {
            conn.exchanges = exchanges;
        }
        done(error, conn);
    });
});

let amqpQuery = queryExecFactory(amqpConnect, (conn, done, ex, sId)=> {
    let exchanges = conn.exchanges;
    if (_.contains(exchanges, ex)) {
        conn.createChannel(function (err, ch) {
            let socket = Streamy.sockets(sId);
            if (channels[sId]) {
                closeCh(channels[sId], sId);
            }
            //keep the channel associate with a client (socket) to close it later
            channels[sId] = ch;
            ch.assertExchange(ex, 'fanout', {durable: false});
            ch.assertQueue('', {exclusive: true}, function (err, q) {
                ch.on('close', function () {
                    console.log(`${sId} channel closed`);
                    Streamy.emit('msg', {content: `${sId} channel closed`}, socket);
                });
                done(err, q.queue);
                Streamy.emit('msg', {content: " [*] Waiting for messages"}, socket);
                ch.bindQueue(q.queue, ex, '');
                ch.consume(q.queue, function (msg) {
                    console.log(" [x] %s", msg.content.toString());
                    let content = msg.content.toString();
                    Streamy.emit('msg', {content}, socket);
                }, {noAck: true});
            });
        });
    } else {
        return done(new Error('Unrecognised exchange'));
    }
});

Meteor.methods({
    //db connectors
    mongodbConnect,
    mysqlConnect,
    pgConnect,
    amqpConnect,
    sparqlConnect,
    htmlConnect: sparqlConnect,
    appConnect(id) {
        let url = Apps.findOne(id).url;
        if (url) {
            HTTP.get(url, {
                    timeout: 30000
                },
                function (error) {
                    if (error) {
                        Apps.update({_id: id}, {$set: {'online': false}});
                    } else {
                        Apps.update({_id: id}, {$set: {'online': true}});
                    }
                });
        } else {
            Apps.update({_id: id}, {$set: {'online': false}});
        }
    },

    //query executors
    mongodbQuery,
    mysqlQuery,
    pgQuery,
    sparqlQuery,
    amqpQuery,

    //utils
    mongodbCollectionNames(distId){
        let db = connPool[distId];

        if (!db) {
            mongodbConnect(distId);
        }

        db = connPool[distId];

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

    amqpCollectionNames(distId){
        let conn = connPool[distId];

        if (!conn) {
            amqpConnect(distId);
        }

        conn = connPool[distId];

        if (!conn) {
            throw new Meteor.Error('not-found', `Distribution ${distId} not initialised`);
        }

        return conn.exchanges;
    }
});

let channels = {};//socketId:channel, each socket only grants for one channels
function closeCh(ch, sId) {
    if (ch) {
        try {
            ch.close();
        }
        catch (e) {
            console.log(e.stackAtStateChange);
        }
        finally {
            delete channels[sId];
        }
    }
}
/**
 * Upon disconnect, clear the client database
 */
Streamy.onDisconnect(function (socket) {
    let sId = Streamy.id(socket),
        ch = channels[sId];

    closeCh(ch, sId);
    Streamy.broadcast('__leave__', {
        'sid': Streamy.id(socket)
    });
});

Streamy.on('amqp_end', function (socket) {
    let sId = Streamy.id(socket),
        ch = channels[sId];

    closeCh(ch, sId);
    Streamy.broadcast('__leave__', {
        'sid': Streamy.id(socket)
    });
});
