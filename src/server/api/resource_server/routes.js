/**
 * Created by xgfd on 04/06/2016.
 */


import express from 'express'
import oidc from '../gateway/oidc'

let router = express.Router();

router.get('/userInfo', oidc.userInfo());

router.get('/echo', (req, res)=> {
    let q = JSON.stringify(req.query);
    res.end(`ok. ${q}`);
});

export default router;
