/**
 *
 * Created by xw4g08 on 16/10/2014.
 */

var queries = require('./dataset/queries.js'),
    crypto = require('crypto'),
    socketio = require('../../app').socketio,
    socketioSSL = require('../../app').socketioSSL
    ;

function stream(req, res, next) {
    "use strict";
    var query, queryDriver, io, streamid, ds;

    ds = req.attach.dataset;

    queryDriver = queries.drivers[ds.querytype.toLowerCase()];
    if (!queryDriver) {
        return next({message: 'Dataset type not supported'});
    }

    query = req.query.query || req.body.query;
    io = req.secure ? socketioSSL : socketio;
    streamid = crypto.randomBytes(32).toString('base64');
    io.of(streamid)
        .on('connection', function (socket) {
            var channel;
            queryDriver(query, null, ds, function (err, result, ch) {
                if (err) {
                    return next(err);
                }
                if (ch) {
                    channel = ch;
                }
                socket.emit('chunk', result);
            });

            socket.on('disconnect', function () {
                console.log('channel close');
                channel.close();
            });

            socket.on('stop', function () {
                console.log('channel close');
                channel.close();
            });
        });
    return res.render('query/streamview', {streamid: streamid});
    //next();
}

function mongostream(req, res, next) {
    "use strict";

    var queryDriver, query, limit, skip, modname, ds;

    ds = req.attach.dataset;

    queryDriver = queries.drivers[ds.querytype.toLowerCase()];
    if (!queryDriver) {
        return next({message: 'Dataset type not supported'});
    }

    query = req.query.query || req.body.query;
    modname = req.query.modname || req.body.modname;
    limit = req.query.limit || req.body.limit;
    skip = req.query.skip || req.body.skip;

    if (modname) {
        query = {
            modname: modname,
            query: query,
            limit: limit ? parseInt(limit) : 1000,
            skip: skip ? parseInt(skip) : 0
        };
    }

    queryDriver(query, null, ds, function (err, stream) {
        if (err) {
            return next(err);
        }

        stream.pipe(res);
    });
}

function nonstream(req, res, next) {
    "use strict";

    var queryDriver, query, mime, ds;

    ds = req.attach.dataset;
    queryDriver = queries.drivers[ds.querytype.toLowerCase()];
    mime = req.query.format || req.body.format;
    query = req.query.query || req.body.query;

    queryDriver(query, mime === 'display' ? 'application/sparql-results+json' : mime, ds, function (err, result) {
        if (err) {
            return next(err);
        }

        if (!mime || mime === 'display') {
            res.send(result);
        } else {
            res.attachment('result.txt');
            res.end(result, 'UTF-8');
        }
    });
}

module.exports = function (req, res, next) {//dispatch function
    "use strict";
    var ds, queryDriver;

    ds = req.attach.dataset;
    if (!ds) {
        return next({message: 'Please select a dataset'});
    }

    queryDriver = queries.drivers[ds.querytype.toLowerCase()];
    if (!queryDriver) {
        return next({message: 'Dataset type not supported'});
    }

    switch (ds.querytype) {
        case 'AMQP':
            stream(req, res, next);
            break;
        case 'MongoDB':
            mongostream(req, res, next);
            break;
        default:
            nonstream(req, res, next);
    }
};