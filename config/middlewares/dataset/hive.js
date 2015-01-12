var http = require('http'),
    logger = require('../../../app/util/logger');


function httpQuery(opts, data, cb) {
    var req = http.request(opts, function(res) {
        var data = "";
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            cb(false, data);
        });
    }).on('error', function(err) {
        logger.error(err);
        cb(err);
    });
    req.write(data);
    req.on('response', function(res) {
        var data = "";
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            cb(false, data);
        });
    });
    req.end();
}

module.exports.query = function(url, query, user, cb) {

    if (!user) user = 'ctdean';
    var data = require('querystring').stringify({
        execute: query,
        'user.name': user
    });

    var parsed = require('url').parse(url);

    var opts = {
        method: 'POST',
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + 'hive',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    };
    httpQuery(opts, data, cb);
};

module.exports.test = function(url, cb) {
    var req = http.get(url + 'status', function(res) {
        console.log("Got response: " + res.statusCode);
        if (res.statusCode === 200) {
            var data = "";
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                json = JSON.parse(data);
                if (json.status.toLowerCase() === 'ok') return cb(false);
                cb({
                    message: json.status
                });
            });
        } else {
            cd({
                message: 'Status code: ' + res.statusCode
            });
        }
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        cb(e);
    });
    req.end();
};
