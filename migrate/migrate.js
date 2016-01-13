/**
 * Created by xgfd on 13/01/2016.
 */
"use strict";

let path = '../app/private/';

let sync = require('synchronize'),
    {from,to} = require('./config'),
    MongoClient = require('mongodb').MongoClient,
    fs = require('fs');

MongoClient.connect(from, function (err, fromDb) {
    if (err) {
        throw err;
    }
    let Clients = fromDb.collection('clients'),
        Users = fromDb.collection('users');

    sync(Clients, 'find');
    sync(Users, 'find');

    sync.fiber(function () {
        //migrate users
        let users = Users.find({});
        sync(users, 'toArray');

        users = users.toArray();
        users = users.map(user=>userTrans(user, Clients));

        fs.writeFile(path + 'users', JSON.stringify(users, null, 2), (err)=> {
            if (err) {
                throw err;
            }
        });

        fromDb.close();
    });
});

//migrate users
function userTrans(user, Clients) {

    let meteorUser = {username: null, profile: {}, email: null};

    meteorUser.username = user.username || user.email;
    meteorUser.email = user.email;
    meteorUser.profile.name = user.firstName + ' ' + user.lastName;

    if (user.org) {
        meteorUser.profile.organisation = user.org;
    }

    if (user.clients) {
        let clients = user.clients;

        clients = clients.map(function (client) {
            let clientObj = Clients.find({_id: client});
            sync(clientObj, 'toArray');

            let {_id:clientId, clientSecret, name} = clientObj.toArray()[0];
            return {clientId, clientSecret, name};
        });

        meteorUser.profile.clients = clients;
    }

    return meteorUser;
}

