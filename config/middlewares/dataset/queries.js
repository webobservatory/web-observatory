'use strict';
//TODO implement this as a middleware
var crypto = require('crypto'),
    mysql = require('mysql'),
    sparql = require('./sparql'),
    hive = require('./hive'),
    pq = require('pq'),
    amqp = require('./amqp_connector'),
    file = require('./file.js'),
    http = require('http'),
    https = require('https'),
    url = require('url'),
    mgclient = require('mongodb').MongoClient,
    ObjectId = require('mongodb').ObjectID;

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
    connection.query(query, function (err, rows) {
        cb(err, rows);
        connection.end();
    });
}

function mgdbHelper(collname, query, db, cb) {
    db.collection(collname, function (err, collection) {
        if (err) {
            return cb(err);
        }
        var stream = collection.find(query.query)
            .limit(query.limit)
            .skip(query.skip)
            .project(query.project)
            .stream({
                transform: function (data) {
                    return JSON.stringify(data);
                }
            });

        stream.on('close', function () {
            db.close();
        });

        cb(null, stream);
    });
}

function mgdbDriver(query, mime, ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds),
        collname = query.modname;

    //deny access to system collections
    if (0 === collname.indexOf('system.')) {
        return cb({message: 'Access denied: querying system collections'});
    }

    try {
        query.query = JSON.parse(query.query);
        if (query.query._id) {
            query.query._id = new ObjectId(query.query._id);
        }
        query.project = JSON.parse(query.project);
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
                    mgdbHelper(collname, query, db, cb);
                });
            } else {
                mgdbHelper(collname, query, db, cb);
            }
        });
    } catch (err) {
        cb(err);
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
    sparql.query(ds.url, query, null, function (err) {
        if (err) {
            cb(err);
        } else {
            cb(null);
        }
    });
}

function mgdbTest(ds, cb) {
    var url = ds.url;
    try {
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
    catch (err) {
        cb(err);
    }
}

function pqTest(ds, cb) {
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

function amqpTest(ds, cb) {
    var url = ds.url,
        pwd = ds.password,
        user = ds.user;

    if (user) {
        url = url.split('://');
        url = url[0] + '://' + user + ':' + pwd + '@' + url[1];
    }

    amqp.testConn(url, cb);
}

function webPageTest(ds, cb) {
    var protocol = http, options;

    options = url.parse(ds.url);

    if (0 === ds.url.indexOf('https')) {
        protocol = https;
        options.rejectUnauthorized = false;
    }


    protocol.get(options, function (res) {
        //console.log(ds.url + ': ' + res.statusCode);
        if (res.statusCode && res.statusCode < 400) {
            cb(null);
        } else {
            cb(new Error(ds.url + ': ' + res.statusCode));
        }
    }).on('error', function (e) {
        console.log(ds.url + ': ' + e);
        cb(e);
    });
}
//decode passwords if the input datasets are of type Entry
function passDecodeWrapper(testFun) {
    return function (ds, cb) {
        if (ds.auth && ds.auth.user) {//ds is an Entry and requires to decipher password
            ds.password = decryptPwd(ds);
            ds.user = ds.auth.user;
        }
        testFun(ds, cb);
    };
}


var tests = {
    sparql: sparqlTest,
    mysql: passDecodeWrapper(mysqlTest),
    postgressql: passDecodeWrapper(pqTest),
    file: function (ds, cb) {
        file.fileExist(ds.url, function (exist) {
            if (!exist) {
                return cb(new Error('File not found'));
            }
            cb(null);
        });

    },
    mongodb: passDecodeWrapper(mgdbTest),
    amqp: passDecodeWrapper(amqpTest),
    visualisation: webPageTest,
    imported: webPageTest
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
                    return cb(err || new Error('Authentication failed'));
                }
                db.listCollections({
                    namesOnly: true
                }, function (err, names) {
                    if (err) {
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
            });
        } else {
            db.listCollections({
                namesOnly: true
            }, function (err, names) {
                if (err) {
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
