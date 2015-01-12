/**
 * Created by xgfd on 11/11/14.
 */
exports.forceSSL = function (req, res, next) {
    'use strict';
    if (!req.secure) {
        var sslPort = req.app.get('httpsPort');
        console.log(req.hostname);
        res.redirect('https://' + req.hostname + ':' + sslPort + req.url);
    } else {
        next();
    }
};

exports.noneSSL = function (req, res, next) {
    'use strict';
    if (req.secure) {
        var port = req.app.get('port');
        res.redirect('http://' + req.hostname + ':' + port + req.url);
    } else {
        next();
    }
};
