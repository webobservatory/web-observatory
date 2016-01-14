/**
 * Created by xgfd on 13/01/2016.
 */
"use strict";

let path = '../app/private/';

let sync = require('synchronize'),
    {from, to} = require('./config'),
    MongoClient = require('mongodb').MongoClient,
    crypto = require('crypto'),
    enc_alg = 'aes256',
    fs = require('fs');

MongoClient.connect(from, function (err, fromDb) {
    if (err) {
        throw err;
    }

    sync.fiber(function () {
        //migrate users
        console.log('exporting users ...');
        let Clients = fromDb.collection('clients'),
            Users = fromDb.collection('users'),
            users = syncFind(Users, {});

        users = users.map(user=>userTrans(user, Clients));

        fs.writeFile(path + 'users', JSON.stringify(users, null, 2), (err)=> {
            if (err) {
                throw err;
            }
        });

        //migrate datasets
        console.log('exporting datasets ...');

        let Entries = fromDb.collection('entries'),
            datasets = syncFind(Entries, {type: 'dataset'});

        datasets = datasets.map(datasetTrans);

        fs.writeFile(path + 'datasets', JSON.stringify(datasets, null, 2), (err)=> {
            if (err) {
                throw err;
            }
        });
        //migrate apps
        console.log('exporting apps ...');
        let apps = syncFind(Entries, {type: 'visualisation'});

        fromDb.close();
    });
});

function syncFind(col, query) {
    let result = col.find(query);

    sync(result, 'toArray');
    return result.toArray();
}

//migrate users helper
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

        clients = clients.map(function (clientId) {
            let clients = syncFind(Clients, {_id: clientId}),
                {clientSecret, name} = clients[0];
            return {clientId, clientSecret, name};
        });

        meteorUser.profile.clients = clients;
    }

    return meteorUser;
}

function datasetTrans(dataset) {
    let meteorDataset = {
        name: null,
        description: null,
        creator: null,
        publisher: null,
        datePublished: null,
        dateModified: null,
        keywords: [],
        license: null,
        aclMeta: true,
        aclContent: false,
        metaWhiteList: [],
        contentWhiteList: [],
        distribution: []
    };

    meteorDataset.name = dataset.name;
    meteorDataset.description = dataset.description;
    meteorDataset.publisher = dataset.publisher;
    meteorDataset.datePublished = dataset.pubdate;
    meteorDataset.dateModified = dataset.modified;
    meteorDataset.keywords = dataset.kw;
    meteorDataset.aclMeta = dataset.opVis;
    meteorDataset.aclContent = dataset.opAcc;
    meteorDataset.metaWhiteList = dataset.canView;
    meteorDataset.contentWhiteList = dataset.canAccess;

    let dist = {url: null, fileFormat: null, online: null};
    dist.url = dataset.url;
    dist.fileFormat = dataset.querytype;
    dist.online = dataset.alive;
    dist.instruction = dataset.queryinfo;

    if (dataset.auth && dataset.auth.user) {
        console.log(dataset);
        dist.profile = {};
        dist.profile.username = dataset.auth.user;
        let decipher = crypto.createDecipher(enc_alg, dataset.url);
        dist.profile.pass = decipher.update(dataset.auth.encpwd, 'hex', 'utf8') + decipher.final('utf8');
    }

    meteorDataset.distribution.push(dist);

    return meteorDataset;
}
