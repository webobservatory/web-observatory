//TODO implement this as a middleware
var crypto = require('crypto'),
    mysql = require('mysql'),
    sparql = require('./sparql'),
    hive = require('./hive'),
    pq = require('pq'),
    mgclient = require('mongodb').MongoClient,
    mongoose = require('mongoose'),
    logger = require('../../app/util/logger');

var enc_alg = 'aes256';

function decryptPwd(ds) {
    var key = ds.url,
        encrypted = ds.auth.encpwd;
    if (!encrypted) return null;
    var decipher = crypto.createDecipher(enc_alg, key);
    var pwd = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    return pwd;
}

function pqDriver(query, mime, ds, cb) {
    var url = 'postgres://' + (ds.auth.user ? ds.auth.user + ':' + pwd : '') + '@' + ds.url;
    var client = new pg.Client(url);
    client.connect(function(err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query(query, function(err, result) {
            cb(err, result);
            client.end();
        });
    });
}

function mysqlDriver(query, mime, ds, cb) {
    var pwd = decryptPwd(ds);
    var options = {};
    options.host = ds.url;
    if (ds.auth.user) {
        options.user = ds.auth.user;
        options.password = pwd;
    }
    var connection = mysql.createConnection(options);
    console.log('query: ');
    console.log(options);
    connection.connect();
    connection.query(query, function(err, rows, fields) {
        cb(err, rows);
        connection.end();
    });
}

function mgdbDriver(query, mime, ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds);

    var modname = query.modname;

    try {
        query.query = JSON.parse(query.query);
        mgclient.connect(url, function(err, db) {
            if (err) return cb(err);
            if (ds.user) {
                db.authenticate(ds.user, pwd, function(err, result) {
                    if (err || !result) return cb(err || {
                        message: 'Authentication failed'
                    });
                    db.collection(modname, function(err, collection) {
                        collection.find(query.query, function(err, result) {
                            cb(err, result);
                            db.close();
                        });
                    });
                });
            } else {
                db.collection(modname, function(err, collection) {
                    collection.find(query.query).toArray(function(err, result) {
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

function hiveDriver(query, mime, ds, cb) {
    hive.query(ds.url, query, ds.user, cb);
}

var drivers = {
    sparql: sparqlDriver,
    mysql: mysqlDriver,
    postgressql: pqDriver,
    mongodb: mgdbDriver,
    hive: hiveDriver
};

function sparqlTest(ds, cb) {
    var query = 'ASK {?s ?p ?o}';
    sparql.query(ds.url, query, null, function(err, data) {
        if (err) {
            cb(err);
        } else {
            cb(null);
        }
    });
}

function mgdbTest(ds, cb) {
    var url = ds.url;
    var opts = {
        user: ds.user,
        pass: ds.password
    };

    mgclient.connect(url, function(err, db) {
        if (err) return cb(err);
        if (ds.user) {
            db.authenticate(ds.user, ds.password, function(err, result) {
                if (err || !result) return cb(err || {
                    message: 'Authentication failed'
                });
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
    var url = 'postgres://' + (ds.user ? ds.user + ':' + ds.password : '') + '@' + ds.url;
    var client = new pg.Client(url);
    client.connect(function(err) {
        cb(err);
        client.end();
    });
}

function mysqlTest(ds, cb) {
    var options = {
        host: ds.url,
        user: ds.user,
        password: ds.password
    };
    var connection = mysql.createConnection(options);
    connection.connect(function(err) {
        cb(err);
        connection.end();
    });
}

var tests = {
    sparql: sparqlTest,
    mysql: mysqlTest,
    postgressql: pqTest,
    //hive: hiveTest,
    mongodb: mgdbTest
};

module.exports.drivers = drivers;
module.exports.tests = tests;
//get all schema names of a mongodb
module.exports.mongodbschema = function(ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds);

    mgclient.connect(url, function(err, db) {
        if (err) return cb(err);
        if (ds.user) {
            db.authenticate(ds.user, pwd, function(err, result) {
                if (err || !result) return cb(err || {
                    message: 'Authentication failed'
                });
                db.collectionNames({
                    namesOnly: true
                }, function(err, names) {
                    cb(err, names);
                    db.close();
                });
            });
        } else {
            db.collectionNames({
                namesOnly: true
            }, function(err, names) {
                names = names.map(function(name) {
                    return name.substring(name.indexOf('.') + 1);
                });
                console.log(names);
                cb(err, names);
                db.close();
            });
        }
    });
};
