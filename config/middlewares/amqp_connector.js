/**
 * Created by Xin on 15/10/2014.
 */
//
var amqp = require('amqplib/callback_api');

function logMessage(cb) {
    "use strict";
    return function (msg) {
        var result;
        if (msg) {
            result = msg.content.toString();
            console.log(" [x] '%s'", result);
            cb(null, result);
        }
    };
}

function on_channel_open(ex, cb) {
    "use strict";
    return function (err, ch) {
        if (err) {
            cb(err);
        }
        ch.assertQueue('', {exclusive: true}, function (err, ok) {
            if (err) {
                cb(err);
            }
            var q = ok.queue;
            ch.bindQueue(q, ex, '');
            ch.consume(q, logMessage(cb), {noAck: true}, function (err) {
                if (err) {
                    cb(err);
                }
                cb(null, ex + ' waiting for messages');
            });
        });
    };
}


/*amqp.connect('amqp://test:admin@app-001.ecs.soton.ac.uk', function (err, conn) {
 "use strict";
 if (err) {
 bail(err);
 }
 conn.createChannel(on_channel_open('wikipedia_hose'));
 });*/

//TODO add pooling for connections & channels
module.exports.getStream = function (opts, cb) {
    "use strict";
    amqp.connect(opts.url, function (err, conn) {
        if (err) {
            cb(err);
        }
        conn.createChannel(on_channel_open(opts.ex, cb));
    });
};
