'use strict';
//TODO implement this as a middleware
var crypto = require('crypto'),
    mysql = require('mysql'),
    sparql = require('./sparql'),
    hive = require('./hive'),
    pq = require('pq'),
    amqp = require('./amqp_connector'),
    mgclient = require('mongodb').MongoClient,
    logger = require('../../../app/util/logger');

var enc_alg = 'aes256';

function decryptPwd(ds) {
    var key = ds.url,
        encrypted = ds.auth.encpwd,
        decipher,
        pwd;
    if (!encrypted) {
        return null;
    }
    decipher = crypto.createDecipher(enc_alg, key);
    pwd = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    return pwd;
}

function pqDriver(query, mime, ds, cb) {
    var url = 'postgres://' + (ds.auth.user ? ds.auth.user + ':' + ds.auth.pwd : '') + '@' + ds.url,
        client = new pq.Client(url);
    client.connect(function (err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query(query, function (err, result) {
            cb(err, result);
            client.end();
        });
    });
}

function mysqlDriver(query, mime, ds, cb) {
    var pwd = decryptPwd(ds), options = {}, connection;
    options.host = ds.url;
    if (ds.auth.user) {
        options.user = ds.auth.user;
        options.password = pwd;
    }
    connection = mysql.createConnection(options);
    connection.connect();
    connection.query(query, function (err, rows, fields) {
        cb(err, rows);
        connection.end();
    });
}

function mgdbDriver(query, mime, ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds),
        modname = query.modname;

    try {
        query.query = JSON.parse(query.query);
        mgclient.connect(url, function (err, db) {
            if (err) {
                return cb(err);
            }
            if (ds.user) {
                db.authenticate(ds.auth.user, pwd, function (err, result) {
                    if (err || !result) {
                        return cb(err || {
                            message: 'Authentication failed'
                        });
                    }
                    db.collection(modname, function (err, collection) {
                        collection.find(query.query, function (err, result) {
                            cb(err, result);
                            db.close();
                        });
                    });
                });
            } else {
                db.collection(modname, function (err, collection) {
                    collection.find(query.query).toArray(function (err, result) {
                        cb(err, result);
                        db.close();
                    });
                });
            }
        });
    } catch (err) {
        cb({
            message: 'Query syntax error'
        });
    }
}

function sparqlDriver(query, mime, ds, cb) {
    sparql.query(ds.url, query, mime, cb);
}

function amqpDriver(query, mime, ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds),
        user = ds.auth.user;

    if (user) {
        url = url.split('://');
        url = url[0] + '://' + user + ':' + pwd + '@' + url[1];
    }

    amqp.getStream({url: url, ex: query}, cb);
}
/*function hiveDriver(query, mime, ds, cb) {
 hive.query(ds.url, query, ds.user, cb);
 }*/

var drivers = {
    sparql: sparqlDriver,
    mysql: mysqlDriver,
    postgressql: pqDriver,
    mongodb: mgdbDriver,
    amqp: amqpDriver
};

function sparqlTest(ds, cb) {
    var query = 'ASK {?s ?p ?o}';
    sparql.query(ds.url, query, null, function (err, data) {
        if (err) {
            cb(err);
        } else {
            cb(null);
        }
    });
}

function mgdbTest(ds, cb) {
    var url = ds.url;

    mgclient.connect(url, function (err, db) {
        if (err) {
            return cb(err);
        }
        if (ds.user) {
            db.authenticate(ds.user, ds.password, function (err, result) {
                if (err || !result) {
                    return cb(err || {
                        message: 'Authentication failed'
                    });
                }
                cb(null);
                db.close();
            });
        } else {
            cb(null);
            db.close();
        }
    });
}

function pqTest(query, mime, ds, cb) {
    var url = 'postgres://' + (ds.user ? ds.user + ':' + ds.password : '') + '@' + ds.url,
        client;

    client = new pq.Client(url);
    client.connect(function (err) {
        cb(err);
        client.end();
    });
}

function mysqlTest(ds, cb) {
    var options = {
            host: ds.url,
            user: ds.user,
            password: ds.password
        },
        connection = mysql.createConnection(options);
    connection.connect(function (err) {
        cb(err);
        connection.end();
    });
}

//dummy tester
//TODO add a real tester
function amqpTest(ds, cb) {
    cb();
}

var tests = {
    sparql: sparqlTest,
    mysql: mysqlTest,
    postgressql: pqTest,
    //hive: hiveTest,
    mongodb: mgdbTest,
    amqp: amqpTest
};

module.exports.drivers = drivers;
module.exports.tests = tests;
//get all schema names of a mongodb
module.exports.mongodbschema = function (ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds);

    mgclient.connect(url, function (err, db) {
        if (err) {
            return cb(err);
        }
        if (ds.user) {
            db.authenticate(ds.user, pwd, function (err, result) {
                if (err || !result) {
                    return cb(err || {
                        message: 'Authentication failed'
                    });
                }
                db.collectionNames({
                    namesOnly: true
                }, function (err, names) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        names = names.map(function (name) {
                            return name.substring(name.indexOf('.') + 1);
                        });
                        //console.log(names);
                        cb(err, names);
                    }
                    db.close();
                });
            });
        } else {
            db.collectionNames({
                namesOnly: true
            }, function (err, names) {
                if (err) {
                    logger.error(err);
                    cb(err);
                }
                else {
                    names = names.map(function (name) {
                        return name.substring(name.indexOf('.') + 1);
                    });
                    cb(err, names);
                }

                db.close();
            });
        }
    });
};
