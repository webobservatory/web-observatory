var winston = require('winston');
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            //json: false,
            timestamp: true
        }),
        new winston.transports.File({
            filename: './log/debug.log',
            //json: false,
            maxsize: 20971520
        })
    ],
    exceptionHandlers: [
        new(winston.transports.Console)({
            //json: false,
            timestamp: true
        }),
        new winston.transports.File({
            filename: './log/debug.log',
            //json: false,
            maxsize: 20971520
        })
    ],
    exitOnError: false
});

module.exports = logger;
