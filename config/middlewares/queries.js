//TODO implement this as a middleware
var crypto = require('crypto'),
    sparql = require('./sparql.js'),
    mysql = require('mysql'),
    pq = require('pq'),
    mongoose = require('mongoose');
var logger = require('../../app/util/logger');

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
    var url = ds.url,
        pwd = decryptPwd(ds);

    var connection = mysql.createConnection({
        host: url,
        user: ds.user,
        password: pwd
    });
    connection.connect();
    connection.query(query, function(err, rows, fields) {
        cb(err, rows);
    });
    connection.end();
}

function mgdbDriver(query, mime, ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds);
    var opts = {
        user: ds.user,
        pass: pwd
    };

    try {
        query = JSON.parse(query);
        var modname = query.modname;
        var connection = mongoose.createConnection(url, opts)
            .on('error', function(err) {
            logger.error(err);
            cb({
                message: 'Cannot connect to ' + url
            });
        })
            .once('connected', function() {
            var model = connection.model(modname);
            model.find(query.query, function(err, results) {
                cb(err, results);
            });
        });
    } catch (err) {
        cb(err);
        logger.error(err);
    }
}

function sparqlDriver(query, mime, ds, cb) {
    sparql.query(ds.url, query, mime, cb);
}

var drivers = {
    sparql: sparqlDriver,
    mysql: mysqlDriver,
    postgressql: pqDriver,
    mongodb: mgdbDriver
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
        var connection = mongoose.createConnection(url, opts)
            .on('error', function(err) {
            console.log(err);
            cb(err);
        })
            .once('connected', function() {
            console.log('connected');
            cb(null);
        });
    } catch (err) {
        cb(err);
    }
}

var tests = {
    sparql: sparqlTest,
    //mysql: mysqltest,
    //postgressql: pqtest,
    mongodb: mgdbTest
};

module.exports.drivers = drivers;
module.exports.tests = tests;
//get all schema names of a mongodb
module.exports.mongodbschema = function(ds, cb) {
    var url = ds.url,
        pwd = decryptPwd(ds);
    var opts = {
        user: ds.user,
        pass: pwd
    };

    var connection = mongoose.createConnection(url, opts)
        .on('error', function(err) {
        logger.error(err);
        cb({
            message: 'Cannot connect to ' + url
        });
    })
        .once('connected', function() {
        var names = connection.modelNames();
        cb(null, names);
    });
};
