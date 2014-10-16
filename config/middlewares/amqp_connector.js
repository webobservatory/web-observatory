/**
 * Created by Xin on 15/10/2014.
 */
//
var amqp = require('amqplib/callback_api'),
    connections = {};

function logMessage(cb) {
    "use strict";
    return function (msg) {
        var result;
        if (msg) {
            result = msg.content;
            console.log(" [x] '%s'", result);
            cb(null, result);
        }
    };
}

function on_channel_open(ex, cb) {
    "use strict";
    return function (err, ch) {
        if (err) {
            return cb(err);
        }
        ch.assertQueue('', {exclusive: true}, function (err, ok) {
            if (err) {
                cb(err);
            }
            var q = ok.queue;
            ch.bindQueue(q, ex, '');
            ch.consume(q, logMessage(cb), {noAck: true}, function (err) {
                if (err) {
                    return cb(err);
                }
                cb(null, ex + ' waiting for messages', ch);
            });
        });
    };
}

//TODO add pooling for connections & channels
module.exports.getStream = function (opts, cb) {
    "use strict";
    var url = opts.url, conn = connections[url];
    if (conn) {
        conn.createChannel(on_channel_open(opts.ex, cb));
    } else {
        amqp.connect(url, function (err, conn) {
            if (err) {
                return cb(err);
            }
            connections[url] = conn;
            conn.createChannel(on_channel_open(opts.ex, cb));
        });
    }
};

module.exports.close=function(url, cb){
    "use strict";
    var conn = connections[url];
    if(conn){
        conn.close(cb);
    }
};
