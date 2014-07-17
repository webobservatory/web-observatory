var logger = require('../../app/util/logger');

module.exports = function(req, res, next) {
    if (0 === req.path.indexOf('/css') * req.path.indexOf('/js') * req.path.indexOf('/fonts') * req.path.indexOf('/images')) return next();

    var _req = {};

    _req.port = req.port;
    _req.host = req.hostname;
    _req.accept = req.accept;
    _req.authorization = req.authorization;
    _req['user-agent'] = req['user-agent'];
    _req['content-type'] = req['content-type'];
    _req.pathname = req.pathname;
    _req.path = req.path;
    console.log(req.query.length);
    if (0 !== req.query.length)
        _req.query = JSON.stringify(req.query);

    if (0 !== req.body.length) {
        _req.body = JSON.stringify(req.body);
        if (req.body.password || req.body.pwd) {
            _req.body = JSON.parse(_req.body); //clone
            //clean
            delete _req.body.pwd;
            delete _req.body.password;
            _req.body = JSON.stringify(_req.body);
        }

        _req.params = JSON.stringify(req.params);
        _req.refer = req.get('referer');
    }

    _req.method = req.method;

    logger.info(_req);
    next();
};
