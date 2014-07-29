var logger = require('../../app/util/logger');

module.exports = function(req, res, next) {
    if (0 === req.path.indexOf('/css') * req.path.indexOf('/js') * req.path.indexOf('/fonts') * req.path.indexOf('/images')*req.path.indexOf('/img')) return next();

    var _req = {};

    _req.userip = req.ip;
    _req.method = req.method;
    _req.protocol = req.protocol;
    _req.host = req.get('host');
    _req.path = req.path;
    _req.originalUrl = req.originalUrl;

    _req.refer = req.get('referer');
    
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
    }

    _req.params = JSON.stringify(req.params);

    _req.accept = req.get('accept');
    if('POST'===req.method) _req.content_type = req.get('content-type');
    _req['user-agent'] = req.get('user-agent');
    _req.authorization = req.get('authorization');

    logger.info(_req);
    next();
};
