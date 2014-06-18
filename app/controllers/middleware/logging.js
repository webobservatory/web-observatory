var logger = require('../../util/logger');

module.exports = function(req, res, next) {
    if (0 === req.path.indexOf('/css') * req.path.indexOf('/js') * req.path.indexOf('/fonts') * req.path.indexOf('/images')) return next();

    var _req = {};

    _req.port = req.port;
    _req.host = req.host;
    _req.accept = req.accept;
    _req.authorization = req.authorization;
    _req['user-agent'] = req['user-agent'];
    _req['content-type'] = req['content-type'];
    _req.pathname = req.pathname;
    _req.path = req.path;
    _req.query = req.query;
    _req.method = req.method;

    logger.info(_req);
    next();
};
