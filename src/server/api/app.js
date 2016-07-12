/**
 * Created by xgfd on 02/06/2016.
 */

import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import oauth_routes from './gateway/routes'
import api_routes from './resource_server/routes'
import client_routes from './gateway/client_routes'
import Cookies from 'cookies'

let app = express();
WebApp.connectHandlers.use(Meteor.bindEnvironment(app));

app.use(session({secret: 'webobservatory', resave: false, saveUninitialized: false}));
app.use(Meteor.bindEnvironment((req, res, next)=> {
    //Check the values in the cookies
    let cookies = new Cookies(req),
        userId = cookies.get("meteor_user_id") || "",
        token = cookies.get("meteor_token") || "";

    //Check a valid user with this token exists
    let user = Meteor.users.findOne({
        _id: userId,
        'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token)
    });
    req.session.user = user && user._id;
    next();
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//setting up routes
app.use('/', oauth_routes);
app.use('/api', api_routes);
// client routes are for testing only
// app.use('/client', client_routes);


