/**
 * Created by xgfd on 03/06/2016.
 */

import express from 'express'
import oidc from './oidc'

let router = express.Router();

router.get('/oauth/authorise', oidc.auth());
router.post('/oauth/token', oidc.token());
router.post('/oauth/decision', oidc.consent());

//user consent form
router.get('/oauth/decision', function (req, res, next) {
    var head = '<head><title>Consent</title></head>';
    var lis = [];
    for (var i in req.session.scopes) {
        lis.push('<li><b>' + i + '</b>: ' + req.session.scopes[i].explain + '</li>');
    }
    var ul = '<ul>' + lis.join('') + '</ul>';
    var error = req.session.error ? '<div>' + req.session.error + '</div>' : '';
    var body = '<body><h1>Consent</h1><form method="POST">' + ul + '<input type="submit" name="accept" value="Accept"/><input type="submit" name="cancel" value="Cancel"/></form>' + error;
    res.send('<html>' + head + body + '</html>');
});

export default router;
