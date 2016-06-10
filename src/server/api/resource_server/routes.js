/**
 * Created by xgfd on 04/06/2016.
 */


import express from 'express'
import oidc from '../gateway/oidc'
import {RESTCompose} from './middlewares/utils'
import {getEntryLst, getEntry} from './middlewares/metadata'
import accessData from './middlewares/content'

let router = express.Router();

/**
 * General API information
 */
router.get('/', RESTCompose({version: '0.1', auth: 'OAuth2.0'}));

/**
 * Datasets routes
 */
router.get('/datasets', oidc.checkAndSetUser(/meta|content/), Meteor.bindEnvironment(getEntryLst));

router.get('/datasets/:id', oidc.checkAndSetUser(/meta|content/), Meteor.bindEnvironment(getEntry));

router.get('/datasets/:_/:id', oidc.checkAndSetUser('content'), Meteor.bindEnvironment(accessData));

/**
 * Apps routes
 */
router.get('/apps', oidc.checkAndSetUser(/meta|content/), Meteor.bindEnvironment(getEntryLst));

router.get('/apps/:id', oidc.checkAndSetUser(/meta|content/), Meteor.bindEnvironment(getEntry));

/**
 * User profile for OIDC
 */
router.get('/userInfo', oidc.userInfo());

/**
 * Testing routes
 */
router.get('/test/meta', oidc.checkAndSetUser(/meta|content/), (req, res)=> {
    res.send(`ok. ${req.user}`);
});

router.get('/test/content', oidc.check('content'), (req, res)=> {
    res.send(`ok. ${req.user}`);
});

export default router;
