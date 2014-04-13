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
    var client = new pg.Client({
        user: ds.user,
        password: decryptPwd(ds),
        host: ds.url
    });
    client.connect(function(err) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        client.query(query, function(err, result) {
            cb(err, result);
            console.log(result.rows[0].theTime);
            client.end();
        });
    });
}

function mysqlDriver(query, mime, ds, cb) {
    var pwd = decryptPwd(ds);
    var url = 'mysql://' + (ds.auth.user ? ds.auth.user + ':' + pwd : '') + '@' + ds.url.split('mysql://')[1];
    var connection = mysql.createConnection(url);
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
        pass: ds.pwd
    };
    try {
        var connection = mongoose.createConnection(url, opts).on('error', function(err) {
            cb(err);
        }).once('connected', function() {
            cb(null);
        });
    } catch (err) {
        cb(err);
    }
}

function hiveTest(ds, cb) {
    hive.test(ds.url, cb);
}

function mysqlTest(ds, cb) {
    var url = 'mysql://' + (ds.user ? ds.user + ':' + ds.pwd : '') + '@' + ds.url.split('mysql://')[1];
    var connection = mysql.createConnection(url);
    connection.connect(function(err) {
        cb(err);
        connection.end();
    });
}

var tests = {
    sparql: sparqlTest,
    mysql: mysqlTest,
    //postgressql: pqTest,
    hive: hiveTest,
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
